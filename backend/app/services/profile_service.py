from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.profile_schema import StudentProfileUpdate


def get_profile(db: Session, current_user: dict) -> dict:
    user = db.get(User, current_user["user_id"])
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    profile = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.certificates))
        .filter(StudentProfile.user_id == user.id)
        .first()
    )
    return {
        "id": profile.id if profile else None,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "certificate_name": profile.certificate_name if profile else user.full_name,
        "date_of_birth": profile.date_of_birth if profile else None,
        "organization": profile.organization if profile else None,
        "country": profile.country if profile else None,
        "bio": profile.bio if profile else None,
        "is_complete": bool(profile and profile.certificate_name.strip()),
        "certificates": sorted(profile.certificates, key=lambda item: item.issued_at, reverse=True) if profile else [],
    }


def update_profile(db: Session, payload: StudentProfileUpdate, current_user: dict) -> dict:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user["user_id"]).first()
    if profile is None:
        profile = StudentProfile(user_id=current_user["user_id"], certificate_name=payload.certificate_name.strip())
        db.add(profile)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    return get_profile(db, current_user)
