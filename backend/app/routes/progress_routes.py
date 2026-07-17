from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services import progress_service
from app.utils.response import success_response

router = APIRouter(tags=["Progress"])


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    data = progress_service.set_lesson_completed(db, lesson_id, current_user["user_id"], True)
    return success_response("Lesson completed", data)


@router.delete("/lessons/{lesson_id}/complete")
def uncomplete_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    data = progress_service.set_lesson_completed(db, lesson_id, current_user["user_id"], False)
    return success_response("Lesson marked incomplete", data)


@router.get("/courses/{course_id}/progress")
def get_course_progress(course_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return success_response("Progress loaded", progress_service.get_course_progress(db, course_id, current_user["user_id"]))
