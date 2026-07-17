from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.schemas.lesson_schema import LessonCreate, LessonUpdate
from app.services.course_service import get_course
from app.utils.authorization import require_course_owner_or_admin


def list_lessons(db: Session, course_id: int) -> list[Lesson]:
    get_course(db, course_id)  # 404s if the course does not exist
    return (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.order_index)
        .all()
    )


def create_lesson(db: Session, course_id: int, payload: LessonCreate, current_user: dict) -> Lesson:
    course = get_course(db, course_id)
    require_course_owner_or_admin(course, current_user)

    lesson = Lesson(**payload.model_dump(), course_id=course_id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def update_lesson(db: Session, lesson_id: int, payload: LessonUpdate, current_user: dict) -> Lesson:
    lesson = _get_lesson(db, lesson_id)
    require_course_owner_or_admin(lesson.course, current_user)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)
    return lesson


def delete_lesson(db: Session, lesson_id: int, current_user: dict) -> None:
    lesson = _get_lesson(db, lesson_id)
    require_course_owner_or_admin(lesson.course, current_user)
    db.delete(lesson)
    db.commit()


def _get_lesson(db: Session, lesson_id: int) -> Lesson:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson
