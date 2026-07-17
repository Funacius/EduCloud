from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services import admin_service
from app.utils.response import success_response

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return success_response("Admin dashboard loaded", admin_service.get_dashboard(db, current_user))
