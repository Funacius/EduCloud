from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services import admin_service
from app.services import monitoring_service
from app.utils.response import success_response

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return success_response("Admin dashboard loaded", admin_service.get_dashboard(db, current_user))


@router.get("/health")
def health_dashboard(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return success_response("Health metrics loaded", monitoring_service.get_health_dashboard(db))


@router.get("/courses")
def course_oversight(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return success_response("Admin courses loaded", admin_service.list_course_oversight(db, current_user))
