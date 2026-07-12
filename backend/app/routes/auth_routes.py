from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app.services import auth_service
from app.utils.response import success_response
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    result = auth_service.register_user(db, payload)
    return success_response("Đăng ký tài khoản thành công", result)

@router.post("/login")
def login(payload: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user_login_data = UserLogin(email=payload.username, password=payload.password)
    result = auth_service.login_user(db, user_login_data)
    return result

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }
    return success_response("Lấy thông tin thành công", user_data)