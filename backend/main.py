from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import auth_routes, course_routes, enrollment_routes, lesson_routes, progress_routes, upload_routes

from app.database import engine, Base
from app.models.user import User

app = FastAPI(title=settings.APP_NAME)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Cho phép giao diện React truy cập
    allow_credentials=True,
    allow_methods=["*"], # Cho phép mọi phương thức (GET, POST, PUT, DELETE)
    allow_headers=["*"], # Cho phép mọi loại header (bao gồm cả Authorization chứa Token)
)
Base.metadata.create_all(bind=engine)

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
