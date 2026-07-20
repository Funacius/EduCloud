import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base
from app.models.instructor_request import InstructorRequest
from app.models.user import User
from app.schemas.instructor_request_schema import InstructorRequestCreate
from app.services import admin_service, instructor_request_service


def test_student_application_rejection_resubmission_and_approval():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    try:
        student = User(id=1, full_name="Alex Student", email="alex@example.com", role="student")
        admin = User(id=2, full_name="Taylor Admin", email="admin@example.com", role="admin")
        db.add_all([student, admin])
        db.commit()
        student_identity = {"user_id": student.id, "role": "student"}
        admin_identity = {"user_id": admin.id, "role": "admin"}
        payload = InstructorRequestCreate(
            organization="EduCloud Academy",
            expertise="AWS and Cloud Computing",
            experience="Three years mentoring cloud computing students.",
            bio="I want to create practical cloud courses for beginners.",
            portfolio_url="https://example.com/alex",
        )

        submitted = instructor_request_service.submit_request(db, payload, student_identity)
        assert submitted["status"] == "pending"
        assert instructor_request_service.get_my_request(db, student_identity)["id"] == submitted["id"]
        assert len(instructor_request_service.list_requests(db, admin_identity, "pending")) == 1
        assert admin_service.get_dashboard(db, admin_identity)["pending_instructor_requests"] == 1

        with pytest.raises(HTTPException) as missing_note:
            instructor_request_service.review_request(db, submitted["id"], "rejected", None, admin_identity)
        assert missing_note.value.status_code == 422

        rejected = instructor_request_service.review_request(db, submitted["id"], "rejected", "Add more teaching detail.", admin_identity)
        assert rejected["status"] == "rejected"
        resubmitted = instructor_request_service.submit_request(db, payload, student_identity)
        assert resubmitted["status"] == "pending"
        assert resubmitted["review_note"] is None

        approved = instructor_request_service.review_request(db, submitted["id"], "approved", "Verified.", admin_identity)
        db.refresh(student)
        assert approved["status"] == "approved"
        assert student.role == "instructor"
        assert db.query(InstructorRequest).count() == 1
        dashboard = admin_service.get_dashboard(db, admin_identity)
        assert dashboard["pending_instructor_requests"] == 0
        assert dashboard["instructors"] == 1

        # The old student JWT can still read the result so the UI can tell the user to sign in again.
        assert instructor_request_service.get_my_request(db, student_identity)["status"] == "approved"
        with pytest.raises(HTTPException) as cannot_submit_again:
            instructor_request_service.submit_request(db, payload, student_identity)
        assert cannot_submit_again.value.status_code == 403
    finally:
        db.close()
