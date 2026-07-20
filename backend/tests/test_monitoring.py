from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.config import settings
from app.database import Base
from app.models.user import User
from app.services import monitoring_service


def test_health_dashboard_reports_database_traffic_and_storage(tmp_path, monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    try:
        db.add(User(full_name="Admin", email="admin@example.com", role="admin"))
        db.commit()
        (tmp_path / "sample.bin").write_bytes(b"educloud")
        monkeypatch.setattr(settings, "LOCAL_UPLOAD_DIR", str(tmp_path))
        monkeypatch.setattr(settings, "UPLOAD_STORAGE", "local")
        monkeypatch.setattr(settings, "AWS_MONITORING_ENABLED", False)
        monitoring_service.record_request("/api/courses", 200, 12.5)

        health = monitoring_service.get_health_dashboard(db)

        assert health["status"] == "operational"
        assert health["database"]["rows"]["users"] == 1
        assert health["traffic"]["total_requests_since_start"] >= 1
        assert health["storage"]["local_size_bytes"] == 8
        assert health["aws"]["estimated_month_cost_usd"] is None
    finally:
        db.close()
