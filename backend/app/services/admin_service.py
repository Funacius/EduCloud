from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.user import User


def get_dashboard(db: Session, current_user: dict) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    role_counts = dict(db.query(User.role, func.count(User.id)).group_by(User.role).all())
    course_counts = dict(db.query(Course.status, func.count(Course.id)).group_by(Course.status).all())
    recent_users = db.query(User).order_by(User.id.desc()).limit(10).all()
    return {
        "total_users": sum(role_counts.values()),
        "students": role_counts.get("student", 0),
        "instructors": role_counts.get("instructor", 0),
        "admins": role_counts.get("admin", 0),
        "published_courses": course_counts.get("published", 0),
        "draft_courses": course_counts.get("draft", 0),
        "total_lessons": db.query(func.count(Lesson.id)).scalar() or 0,
        "total_enrollments": db.query(func.count(Enrollment.id)).scalar() or 0,
        "recent_users": [
            {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role}
            for user in recent_users
        ],
    }
