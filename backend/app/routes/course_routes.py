from fastapi import APIRouter

from app.services import course_service
from app.utils.response import success_response

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("")
def list_courses():
    # TODO API Developer - Course & Lesson: Add filtering, pagination, and response schema.
    return success_response("Courses loaded", course_service.list_courses())


@router.get("/{course_id}")
def get_course(course_id: int):
    # TODO API Developer - Course & Lesson: Return course details with lessons.
    return success_response("Course loaded", course_service.get_course(course_id))


@router.post("")
def create_course(payload: dict):
    # TODO API Developer - Course & Lesson: Require instructor role.
    return success_response("Course created", course_service.create_course(payload))


@router.put("/{course_id}")
def update_course(course_id: int, payload: dict):
    # TODO API Developer - Course & Lesson: Require course owner or admin role.
    return success_response("Course updated", course_service.update_course(course_id, payload))


@router.delete("/{course_id}")
def delete_course(course_id: int):
    # TODO API Developer - Course & Lesson: Decide soft delete or hard delete.
    return success_response("Course deleted", course_service.delete_course(course_id))
