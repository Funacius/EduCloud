from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.user_schema import AuthResult, LoginRequest, UserCreate, UserRead
from app.services import auth_service
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, payload)
    result = {"token": auth_service.create_access_token(user.id, user.role), "user": UserRead.model_validate(user)}
    return success_response("User registered successfully", AuthResult.model_validate(result))


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return success_response("User logged in successfully", AuthResult.model_validate(auth_service.login_user(db, payload)))


@router.get("/me")
def me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return success_response("Current user loaded", UserRead.model_validate(auth_service.get_user(db, current_user["user_id"])))
