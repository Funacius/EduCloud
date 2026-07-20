from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.profile_schema import StudentProfileRead, StudentProfileUpdate
from app.services import profile_service
from app.utils.response import success_response

router = APIRouter(prefix="/profile", tags=["Student Profile"])


@router.get("")
def profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return success_response("Student profile loaded", StudentProfileRead.model_validate(profile_service.get_profile(db, current_user)))


@router.put("")
def update_profile(payload: StudentProfileUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return success_response("Student profile updated", StudentProfileRead.model_validate(profile_service.update_profile(db, payload, current_user)))
