from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.assessment_schema import (
    AssessmentInstructorRead,
    AssessmentStartRead,
    AssessmentStudentRead,
    AssessmentSubmit,
    AssessmentSubmitRead,
    AssessmentUpsert,
)
from app.services import assessment_service
from app.utils.response import success_response

router = APIRouter(tags=["Assessments"])


@router.get("/instructor/courses/{course_id}/assessment")
def instructor_assessment(course_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    data = assessment_service.get_instructor_assessment(db, course_id, current_user)
    return success_response("Assessment loaded", AssessmentInstructorRead.model_validate(data))


@router.put("/instructor/courses/{course_id}/assessment")
def save_instructor_assessment(
    course_id: int,
    payload: AssessmentUpsert,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    data = assessment_service.save_instructor_assessment(db, course_id, payload, current_user)
    return success_response("Assessment saved", AssessmentInstructorRead.model_validate(data))


@router.get("/courses/{course_id}/assessment")
def student_assessment(course_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    data = assessment_service.get_student_assessment(db, course_id, current_user)
    return success_response("Assessment loaded", AssessmentStudentRead.model_validate(data))


@router.post("/courses/{course_id}/assessment/start")
def start_assessment(course_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    data = assessment_service.start_student_assessment(db, course_id, current_user)
    return success_response("Assessment started", AssessmentStartRead.model_validate(data))


@router.post("/courses/{course_id}/assessment/submit")
def submit_assessment(
    course_id: int,
    payload: AssessmentSubmit,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    data = assessment_service.submit_student_assessment(db, course_id, payload, current_user)
    return success_response("Assessment submitted", AssessmentSubmitRead.model_validate(data))
