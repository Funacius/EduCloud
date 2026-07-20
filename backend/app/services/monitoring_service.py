from collections import Counter, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from time import monotonic, perf_counter

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.config import settings
from app.models.assessment import AssessmentAttempt
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.user import User

_started_at = monotonic()
_requests: deque[tuple[datetime, str, int, float]] = deque(maxlen=10000)
_lock = Lock()


def record_request(path: str, status_code: int, duration_ms: float) -> None:
    with _lock:
        _requests.append((datetime.now(timezone.utc), path, status_code, duration_ms))


def _traffic_snapshot() -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    with _lock:
        rows = list(_requests)
    recent = [row for row in rows if row[0] >= cutoff]
    route_counts = Counter(row[1] for row in rows)
    durations = [row[3] for row in recent]
    return {
        "total_requests_since_start": len(rows),
        "requests_last_5_minutes": len(recent),
        "errors_last_5_minutes": sum(1 for row in recent if row[2] >= 500),
        "client_errors_last_5_minutes": sum(1 for row in recent if 400 <= row[2] < 500),
        "average_response_ms_last_5_minutes": round(sum(durations) / len(durations), 2) if durations else 0,
        "top_routes": [{"path": path, "requests": count} for path, count in route_counts.most_common(8)],
    }


def _database_snapshot(db: Session) -> dict:
    started = perf_counter()
    db.execute(text("SELECT 1"))
    latency_ms = round((perf_counter() - started) * 1000, 2)
    dialect = db.bind.dialect.name if db.bind else "unknown"
    size_bytes = None
    if dialect == "postgresql":
        size_bytes = int(db.execute(text("SELECT pg_database_size(current_database())")).scalar() or 0)
    elif dialect == "sqlite":
        database_path = str(db.bind.url.database or "") if db.bind else ""
        if database_path and database_path != ":memory:" and Path(database_path).exists():
            size_bytes = Path(database_path).stat().st_size
    return {
        "status": "operational",
        "engine": dialect,
        "latency_ms": latency_ms,
        "size_bytes": size_bytes,
        "rows": {
            "users": db.query(func.count(User.id)).scalar() or 0,
            "courses": db.query(func.count(Course.id)).scalar() or 0,
            "lessons": db.query(func.count(Lesson.id)).scalar() or 0,
            "enrollments": db.query(func.count(Enrollment.id)).scalar() or 0,
            "assessment_attempts": db.query(func.count(AssessmentAttempt.id)).scalar() or 0,
            "certificates": db.query(func.count(Certificate.id)).scalar() or 0,
        },
    }


def _local_storage_size() -> int:
    root = Path(settings.LOCAL_UPLOAD_DIR)
    if not root.exists():
        return 0
    return sum(path.stat().st_size for path in root.rglob("*") if path.is_file())


def _latest_cloudwatch_value(metric_name: str, storage_type: str) -> float | None:
    client = boto3.client("cloudwatch", region_name=settings.AWS_REGION)
    end = datetime.now(timezone.utc)
    result = client.get_metric_statistics(
        Namespace="AWS/S3",
        MetricName=metric_name,
        Dimensions=[
            {"Name": "BucketName", "Value": settings.AWS_S3_BUCKET_NAME},
            {"Name": "StorageType", "Value": storage_type},
        ],
        StartTime=end - timedelta(days=3),
        EndTime=end,
        Period=86400,
        Statistics=["Average"],
    )
    points = sorted(result.get("Datapoints", []), key=lambda point: point["Timestamp"], reverse=True)
    return float(points[0]["Average"]) if points else None


def _aws_snapshot() -> dict:
    result = {
        "monitoring_enabled": settings.AWS_MONITORING_ENABLED,
        "estimated_month_cost_usd": None,
        "credits_applied_this_month_usd": None,
        "message": "Enable AWS_MONITORING_ENABLED after granting read-only Cost Explorer and CloudWatch permissions.",
    }
    if not settings.AWS_MONITORING_ENABLED:
        return result
    try:
        today = datetime.now(timezone.utc).date()
        start = today.replace(day=1).isoformat()
        end = (today + timedelta(days=1)).isoformat()
        client = boto3.client("ce", region_name="us-east-1")
        cost = client.get_cost_and_usage(
            TimePeriod={"Start": start, "End": end},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
        )
        amount = cost["ResultsByTime"][0]["Total"]["UnblendedCost"]["Amount"]
        credit = client.get_cost_and_usage(
            TimePeriod={"Start": start, "End": end},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            Filter={"Dimensions": {"Key": "RECORD_TYPE", "Values": ["Credit"]}},
        )
        credit_amount = credit["ResultsByTime"][0]["Total"]["UnblendedCost"]["Amount"]
        result.update({
            "estimated_month_cost_usd": round(float(amount), 4),
            "credits_applied_this_month_usd": round(abs(float(credit_amount)), 4),
            "message": "Cost Explorer values can be delayed by AWS.",
        })
    except (BotoCoreError, ClientError, KeyError, IndexError, ValueError) as error:
        result["message"] = f"AWS billing metrics unavailable: {error.__class__.__name__}"
    return result


def _storage_snapshot() -> dict:
    snapshot = {
        "mode": settings.UPLOAD_STORAGE.lower(),
        "local_size_bytes": _local_storage_size(),
        "s3_configured": bool(settings.AWS_S3_BUCKET_NAME),
        "s3_bucket": settings.AWS_S3_BUCKET_NAME if settings.UPLOAD_STORAGE.lower() == "s3" else None,
        "s3_size_bytes": None,
        "s3_object_count": None,
    }
    if settings.UPLOAD_STORAGE.lower() == "s3" and settings.AWS_MONITORING_ENABLED:
        try:
            snapshot["s3_size_bytes"] = _latest_cloudwatch_value("BucketSizeBytes", "StandardStorage")
            snapshot["s3_object_count"] = _latest_cloudwatch_value("NumberOfObjects", "AllStorageTypes")
        except (BotoCoreError, ClientError):
            pass
    return snapshot


def get_health_dashboard(db: Session) -> dict:
    checked_at = datetime.now(timezone.utc)
    try:
        database = _database_snapshot(db)
    except Exception as error:  # health output must survive a partial dependency failure
        database = {"status": "degraded", "error": error.__class__.__name__, "rows": {}}
    storage = _storage_snapshot()
    aws = _aws_snapshot()
    return {
        "status": "operational" if database.get("status") == "operational" else "degraded",
        "checked_at": checked_at,
        "uptime_seconds": round(monotonic() - _started_at),
        "database": database,
        "traffic": _traffic_snapshot(),
        "storage": storage,
        "aws": aws,
        "services": [
            {"name": "FastAPI", "status": "operational", "detail": "Application process is responding"},
            {"name": "Database", "status": database.get("status", "unknown"), "detail": database.get("engine", "Connection unavailable")},
            {"name": "Amazon Cognito", "status": "configured" if settings.COGNITO_ISSUER else "not_configured", "detail": settings.COGNITO_REGION or "Missing region"},
            {"name": "Object storage", "status": "configured" if storage["mode"] in {"local", "s3"} else "not_configured", "detail": storage["mode"]},
        ],
    }
