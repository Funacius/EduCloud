from fastapi import FastAPI

from app.config import settings
from app.routes import auth_routes, course_routes, enrollment_routes, lesson_routes, progress_routes, upload_routes

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
