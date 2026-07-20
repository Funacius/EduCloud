from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services import enrollment_service
from app.utils.response import success_response

router = APIRouter(tags=["Enrollment"])


@router.post("/courses/{course_id}/enroll")
def enroll_course(course_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    enrollment = enrollment_service.enroll_course(db, course_id, current_user)
    return success_response("Course enrolled", {"id": enrollment.id, "course_id": enrollment.course_id, "status": enrollment.status})


@router.get("/my-courses")
def get_my_courses(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return success_response("My courses loaded", enrollment_service.get_student_dashboard(db, current_user["user_id"], current_user.get("role", "")))
