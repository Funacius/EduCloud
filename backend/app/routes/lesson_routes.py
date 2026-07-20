from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.lesson_schema import LessonCreate, LessonRead, LessonUpdate
from app.services import lesson_service
from app.services.course_service import get_course
from app.utils.authorization import require_course_owner_or_admin
from app.utils.response import success_response

router = APIRouter(tags=["Lessons"])


@router.get("/courses/{course_id}/lessons")
def list_lessons(course_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_course_owner_or_admin(get_course(db, course_id), current_user)
    lessons = lesson_service.list_lessons(db, course_id)
    return success_response("Lessons loaded", [LessonRead.model_validate(lesson) for lesson in lessons])


@router.post("/courses/{course_id}/lessons")
def create_lesson(
    course_id: int,
    payload: LessonCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    lesson = lesson_service.create_lesson(db, course_id, payload, current_user)
    return success_response("Lesson created", LessonRead.model_validate(lesson))


@router.put("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: int,
    payload: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    lesson = lesson_service.update_lesson(db, lesson_id, payload, current_user)
    return success_response("Lesson updated", LessonRead.model_validate(lesson))


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    lesson_service.delete_lesson(db, lesson_id, current_user)
    return success_response("Lesson deleted", {"id": lesson_id})
