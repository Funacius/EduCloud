from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.course_schema import CourseCreate, CourseDetail, CourseRead, CourseUpdate
from app.services import course_service
from app.utils.response import success_response

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("")
def list_courses(db: Session = Depends(get_db)):
    courses = course_service.list_courses(db)
    return success_response("Courses loaded", [CourseRead.model_validate(course) for course in courses])


@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = course_service.get_course(db, course_id)
    return success_response("Course loaded", CourseDetail.model_validate(course))


@router.post("")
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    course = course_service.create_course(db, payload, current_user)
    return success_response("Course created", CourseRead.model_validate(course))


@router.put("/{course_id}")
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    course = course_service.update_course(db, course_id, payload, current_user)
    return success_response("Course updated", CourseRead.model_validate(course))


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    course_service.delete_course(db, course_id, current_user)
    return success_response("Course deleted", {"id": course_id})
