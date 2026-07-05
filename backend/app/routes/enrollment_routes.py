from fastapi import APIRouter

from app.services import enrollment_service
from app.utils.response import success_response

router = APIRouter(tags=["Enrollment"])


@router.post("/courses/{course_id}/enroll")
def enroll_course(course_id: int):
    # TODO API Developer - Enrollment, Upload & Testing: Prevent duplicate enrollment.
    return success_response("Course enrolled", enrollment_service.enroll_course(course_id))


@router.get("/my-courses")
def get_my_courses():
    # TODO API Developer - Enrollment, Upload & Testing: Return current user's enrolled courses.
    return success_response("My courses loaded", enrollment_service.get_my_courses())
