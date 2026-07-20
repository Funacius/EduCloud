from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.instructor_request_schema import InstructorRequestCreate, InstructorRequestRead, InstructorRequestReview
from app.services import instructor_request_service
from app.utils.response import success_response

router = APIRouter(tags=["Instructor requests"])


@router.post("/instructor-requests")
def submit_request(
    payload: InstructorRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = instructor_request_service.submit_request(db, payload, current_user)
    return success_response("Instructor request submitted", InstructorRequestRead.model_validate(result))


@router.get("/instructor-requests/me")
def my_request(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = instructor_request_service.get_my_request(db, current_user)
    return success_response("Instructor request loaded", InstructorRequestRead.model_validate(result) if result else None)


@router.get("/admin/instructor-requests")
def list_requests(
    request_status: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    results = instructor_request_service.list_requests(db, current_user, request_status)
    return success_response("Instructor requests loaded", [InstructorRequestRead.model_validate(item) for item in results])


@router.put("/admin/instructor-requests/{request_id}/approve")
def approve_request(
    request_id: int,
    payload: InstructorRequestReview,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = instructor_request_service.review_request(db, request_id, "approved", payload.review_note, current_user)
    return success_response("Instructor request approved", InstructorRequestRead.model_validate(result))


@router.put("/admin/instructor-requests/{request_id}/reject")
def reject_request(
    request_id: int,
    payload: InstructorRequestReview,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = instructor_request_service.review_request(db, request_id, "rejected", payload.review_note, current_user)
    return success_response("Instructor request rejected", InstructorRequestRead.model_validate(result))
