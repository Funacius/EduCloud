from fastapi import APIRouter

from app.services import lesson_service
from app.utils.response import success_response

router = APIRouter(tags=["Lessons"])


@router.get("/courses/{course_id}/lessons")
def list_lessons(course_id: int):
    # TODO API Developer - Course & Lesson: Return lessons ordered by lesson number.
    return success_response("Lessons loaded", lesson_service.list_lessons(course_id))


@router.post("/courses/{course_id}/lessons")
def create_lesson(course_id: int, payload: dict):
    # TODO API Developer - Course & Lesson: Require instructor role.
    return success_response("Lesson created", lesson_service.create_lesson(course_id, payload))


@router.put("/lessons/{lesson_id}")
def update_lesson(lesson_id: int, payload: dict):
    # TODO API Developer - Course & Lesson: Validate lesson owner through course owner.
    return success_response("Lesson updated", lesson_service.update_lesson(lesson_id, payload))


@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int):
    # TODO API Developer - Course & Lesson: Remove lesson safely.
    return success_response("Lesson deleted", lesson_service.delete_lesson(lesson_id))
