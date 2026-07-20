from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.instructor_request import InstructorRequest
from app.models.user import User
from app.schemas.instructor_request_schema import InstructorRequestCreate


def _require_admin(current_user: dict) -> None:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def _student_token_user(db: Session, current_user: dict) -> User:
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    user = db.get(User, current_user["user_id"])
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _read(request: InstructorRequest, user: User) -> dict:
    return {
        **{column.name: getattr(request, column.name) for column in InstructorRequest.__table__.columns},
        "applicant_name": user.full_name,
        "applicant_email": user.email,
    }


def submit_request(db: Session, payload: InstructorRequestCreate, current_user: dict) -> dict:
    user = _student_token_user(db, current_user)
    if user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can request instructor access")
    request = db.query(InstructorRequest).filter_by(user_id=user.id).first()
    if request and request.status == "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Your instructor request is already pending")
    if request and request.status == "approved":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Instructor access has already been approved")
    if request is None:
        request = InstructorRequest(user_id=user.id, **payload.model_dump())
        db.add(request)
    else:
        for field, value in payload.model_dump().items():
            setattr(request, field, value)
        request.status = "pending"
        request.review_note = None
        request.reviewed_by = None
        request.reviewed_at = None
    db.commit()
    db.refresh(request)
    return _read(request, user)


def get_my_request(db: Session, current_user: dict) -> dict | None:
    user = _student_token_user(db, current_user)
    request = db.query(InstructorRequest).filter_by(user_id=user.id).first()
    return _read(request, user) if request else None


def list_requests(db: Session, current_user: dict, request_status: str | None = None) -> list[dict]:
    _require_admin(current_user)
    query = db.query(InstructorRequest, User).join(User, User.id == InstructorRequest.user_id)
    if request_status:
        if request_status not in {"pending", "approved", "rejected"}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid request status")
        query = query.filter(InstructorRequest.status == request_status)
    rows = query.order_by(InstructorRequest.created_at.desc(), InstructorRequest.id.desc()).all()
    return [_read(request, user) for request, user in rows]


def review_request(
    db: Session,
    request_id: int,
    decision: str,
    review_note: str | None,
    current_user: dict,
) -> dict:
    _require_admin(current_user)
    request = db.get(InstructorRequest, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instructor request not found")
    if request.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This instructor request has already been reviewed")
    if decision == "rejected" and not (review_note and review_note.strip()):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Add a review note before rejecting the request")
    user = db.get(User, request.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Applicant account not found")
    request.status = decision
    request.review_note = review_note.strip() if review_note else None
    request.reviewed_by = current_user["user_id"]
    request.reviewed_at = datetime.now(timezone.utc)
    if decision == "approved":
        user.role = "instructor"
    db.commit()
    db.refresh(request)
    return _read(request, user)
