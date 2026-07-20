from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.certificate import Certificate
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.services.certificate_service import issue_if_course_completed


def _lesson_for_enrolled_student(db: Session, lesson_id: int, current_user: dict) -> Lesson:
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    user_id = current_user["user_id"]
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    enrolled = db.query(Enrollment).filter_by(user_id=user_id, course_id=lesson.course_id).first()
    if enrolled is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enroll in this course before tracking progress")
    return lesson


def set_lesson_completed(db: Session, lesson_id: int, current_user: dict, completed: bool) -> dict:
    user_id = current_user["user_id"]
    lesson = _lesson_for_enrolled_student(db, lesson_id, current_user)
    if not completed and db.query(Certificate).filter_by(user_id=user_id, course_id=lesson.course_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Completed courses with an issued certificate cannot be marked incomplete")
    progress = db.query(Progress).filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if progress is None:
        progress = Progress(user_id=user_id, course_id=lesson.course_id, lesson_id=lesson_id, is_completed=completed)
        db.add(progress)
    else:
        progress.is_completed = completed
    db.flush()
    certificate = issue_if_course_completed(db, user_id, lesson.course_id) if completed else None
    db.commit()
    return {
        "lesson_id": lesson_id,
        "course_id": lesson.course_id,
        "is_completed": completed,
        "certificate_issued": bool(certificate),
        "certificate_code": certificate.certificate_code if certificate else None,
    }


def get_course_progress(db: Session, course_id: int, current_user: dict) -> dict:
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    user_id = current_user["user_id"]
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
    # Idempotent backfill for courses completed before certificates were added.
    if total and len(completed_ids) >= total:
        issue_if_course_completed(db, user_id, course_id)
        db.commit()
    return {
        "course_id": course_id,
        "completed_lessons": len(completed_ids),
        "total_lessons": total,
        "percentage": round(len(completed_ids) * 100 / total) if total else 0,
        "completed_lesson_ids": completed_ids,
    }
