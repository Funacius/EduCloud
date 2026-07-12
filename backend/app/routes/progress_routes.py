from fastapi import APIRouter

from app.services import progress_service
from app.utils.response import success_response

router = APIRouter(tags=["Progress"])


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int):
    # TODO API Developer - Enrollment, Upload & Testing: Confirm lesson belongs to enrolled course.
    return success_response("Lesson completed", progress_service.complete_lesson(lesson_id))


@router.get("/courses/{course_id}/progress")
def get_course_progress(course_id: int):
    # TODO API Developer - Enrollment, Upload & Testing: Return progress summary.
    return success_response("Progress loaded", progress_service.get_course_progress(course_id))
