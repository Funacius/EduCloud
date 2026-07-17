from fastapi import HTTPException, status

from app.models.course import Course

INSTRUCTOR_ROLES = {"instructor", "admin"}


def require_instructor(current_user: dict) -> None:
    if current_user.get("role") not in INSTRUCTOR_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Instructor role required")


def require_course_owner_or_admin(course: Course, current_user: dict) -> None:
    if current_user.get("role") != "admin" and course.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to modify this course")
