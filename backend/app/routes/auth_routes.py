from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.middleware.auth_middleware import get_current_user
from app.schemas.user_schema import AuthResult, CognitoExchangeRequest, ForgotPasswordRequest, LoginRequest, UserCreate, UserRead
from app.services import auth_service, cognito_service
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


def require_legacy_auth() -> None:
    if not settings.ALLOW_LEGACY_AUTH:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Legacy authentication is disabled")


@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    require_legacy_auth()
    user = auth_service.register_user(db, payload)
    result = {"token": auth_service.create_access_token(user.id, user.role), "user": UserRead.model_validate(user)}
    return success_response("User registered successfully", AuthResult.model_validate(result))


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    require_legacy_auth()
    return success_response("User logged in successfully", AuthResult.model_validate(auth_service.login_user(db, payload)))


@router.post("/cognito/exchange")
def exchange_cognito_token(payload: CognitoExchangeRequest, db: Session = Depends(get_db)):
    result = cognito_service.exchange_token(db, payload.id_token)
    return success_response("Cognito session exchanged", AuthResult.model_validate(result))


@router.post("/forgot-password")
def request_password_reset(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    cognito_service.request_password_reset(db, str(payload.email))
    return success_response(
        "If a confirmed EduCloud account exists for this email, a reset code has been sent",
        {"accepted": True},
    )


@router.get("/me")
def me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return success_response("Current user loaded", UserRead.model_validate(auth_service.get_user(db, current_user["user_id"])))
