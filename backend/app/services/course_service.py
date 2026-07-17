from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course
from app.schemas.course_schema import CourseCreate, CourseUpdate
from app.utils.authorization import require_course_owner_or_admin, require_instructor


def list_courses(db: Session) -> list[Course]:
    return (
        db.query(Course)
        .filter(Course.status == "published")
        .order_by(Course.created_at.desc())
        .all()
    )


def list_instructor_courses(db: Session, current_user: dict) -> list[Course]:
    require_instructor(current_user)
    return (
        db.query(Course)
        .filter(Course.instructor_id == current_user["user_id"])
        .order_by(Course.updated_at.desc())
        .all()
    )


def get_course(db: Session, course_id: int) -> Course:
    course = (
        db.query(Course)
        .options(joinedload(Course.lessons))
        .filter(Course.id == course_id)
        .first()
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def create_course(db: Session, payload: CourseCreate, current_user: dict) -> Course:
    require_instructor(current_user)

    course = Course(**payload.model_dump(), instructor_id=current_user["user_id"])
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_course(db: Session, course_id: int, payload: CourseUpdate, current_user: dict) -> Course:
    course = get_course(db, course_id)
    require_course_owner_or_admin(course, current_user)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course_id: int, current_user: dict) -> None:
    course = get_course(db, course_id)
    require_course_owner_or_admin(course, current_user)
    db.delete(course)
    db.commit()
