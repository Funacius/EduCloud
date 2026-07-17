from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401  (registers all models on Base.metadata before create_all)
from app.config import settings
from app.database import Base, engine
from app.database_migrations import ensure_course_detail_columns, ensure_user_auth_columns
from app.routes import admin_routes, auth_routes, course_routes, enrollment_routes, lesson_routes, progress_routes, upload_routes

# TODO AWS + DevOps: Replace with Alembic migrations once RDS is provisioned.
Base.metadata.create_all(bind=engine)
ensure_course_detail_columns(engine)
ensure_user_auth_columns(engine)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/")
def health_check():
    return {
        "success": True,
        "message": "EduCloud Lite API is running",
        "data": {"environment": settings.APP_ENV},
    }
