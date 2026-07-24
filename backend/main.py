from pathlib import Path
from time import perf_counter

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401  (registers all models on Base.metadata before create_all)
from app.config import settings
from app.database import Base, engine
from app.database_migrations import ensure_assessment_answer_columns, ensure_course_detail_columns, ensure_learning_unique_indexes, ensure_user_auth_columns
from app.routes import admin_routes, assessment_routes, auth_routes, course_routes, enrollment_routes, instructor_request_routes, lesson_routes, profile_routes, progress_routes, upload_routes
from app.middleware.security_middleware import apply_security_headers, is_rate_limited
from app.services.monitoring_service import record_request

# TODO AWS + DevOps: Replace with Alembic migrations once RDS is provisioned.
Base.metadata.create_all(bind=engine)
ensure_course_detail_columns(engine)
ensure_user_auth_columns(engine)
ensure_learning_unique_indexes(engine)
ensure_assessment_answer_columns(engine)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SENSITIVE_AUTH_PATHS = {
    f"{settings.API_PREFIX}/auth/register",
    f"{settings.API_PREFIX}/auth/login",
    f"{settings.API_PREFIX}/auth/cognito/exchange",
    f"{settings.API_PREFIX}/auth/forgot-password",
}


@app.middleware("http")
async def security_and_monitoring(request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    started = perf_counter()
    if request.url.path in SENSITIVE_AUTH_PATHS and is_rate_limited(client_ip, request.url.path):
        response = JSONResponse(status_code=429, content={"detail": "Too many requests. Please wait and try again."})
    else:
        response = await call_next(request)
    duration_ms = (perf_counter() - started) * 1000
    route = request.scope.get("route")
    route_path = getattr(route, "path", request.url.path)
    record_request(route_path, response.status_code, duration_ms)
    apply_security_headers(response)
    return response

if settings.UPLOAD_STORAGE.lower() == "local":
    Path(settings.LOCAL_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="uploads")

app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(course_routes.router, prefix=settings.API_PREFIX)
app.include_router(lesson_routes.router, prefix=settings.API_PREFIX)
app.include_router(enrollment_routes.router, prefix=settings.API_PREFIX)
app.include_router(progress_routes.router, prefix=settings.API_PREFIX)
app.include_router(upload_routes.router, prefix=settings.API_PREFIX)
app.include_router(admin_routes.router, prefix=settings.API_PREFIX)
app.include_router(profile_routes.router, prefix=settings.API_PREFIX)
app.include_router(instructor_request_routes.router, prefix=settings.API_PREFIX)
app.include_router(assessment_routes.router, prefix=settings.API_PREFIX)


@app.get("/")
def health_check():
    return {
        "success": True,
        "message": "EduCloud Lite API is running",
        "data": {"environment": settings.APP_ENV},
    }
