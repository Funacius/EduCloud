from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import Progress


def _lesson_for_enrolled_student(db: Session, lesson_id: int, user_id: int) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    enrolled = db.query(Enrollment).filter_by(user_id=user_id, course_id=lesson.course_id).first()
    if enrolled is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enroll in this course before tracking progress")
    return lesson


def set_lesson_completed(db: Session, lesson_id: int, user_id: int, completed: bool) -> dict:
    lesson = _lesson_for_enrolled_student(db, lesson_id, user_id)
    progress = db.query(Progress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if progress is None:
        progress = Progress(user_id=user_id, course_id=lesson.course_id, lesson_id=lesson_id, is_completed=completed)
        db.add(progress)
    else:
        progress.is_completed = completed
    db.commit()
    return {"lesson_id": lesson_id, "course_id": lesson.course_id, "is_completed": completed}


def get_course_progress(db: Session, course_id: int, user_id: int) -> dict:
    enrolled = db.query(Enrollment).filter_by(user_id=user_id, course_id=course_id).first()
    if enrolled is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student is not enrolled in this course")
    lesson_ids = [row[0] for row in db.query(Lesson.id).filter(Lesson.course_id == course_id).all()]
    completed_ids = [] if not lesson_ids else [row[0] for row in db.query(Progress.lesson_id).filter(
        Progress.user_id == user_id,
        Progress.course_id == course_id,
        Progress.is_completed.is_(True),
        Progress.lesson_id.in_(lesson_ids),
    ).all()]
    total = len(lesson_ids)
    return {
        "course_id": course_id,
        "completed_lessons": len(completed_ids),
        "total_lessons": total,
        "percentage": round(len(completed_ids) * 100 / total) if total else 0,
        "completed_lesson_ids": completed_ids,
    }
