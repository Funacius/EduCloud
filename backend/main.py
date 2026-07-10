from fastapi import FastAPI

from app import models  # noqa: F401  (registers all models on Base.metadata before create_all)
from app.config import settings
from app.database import Base, engine
from app.routes import auth_routes, course_routes, enrollment_routes, lesson_routes, progress_routes, upload_routes

# TODO AWS + DevOps: Replace with Alembic migrations once RDS is provisioned.
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(course_routes.router, prefix=settings.API_PREFIX)
app.include_router(lesson_routes.router, prefix=settings.API_PREFIX)
app.include_router(enrollment_routes.router, prefix=settings.API_PREFIX)
app.include_router(progress_routes.router, prefix=settings.API_PREFIX)
app.include_router(upload_routes.router, prefix=settings.API_PREFIX)


@app.get("/")
def health_check():
    return {
        "success": True,
        "message": "EduCloud Lite API is running",
        "data": {"environment": settings.APP_ENV},
    }
