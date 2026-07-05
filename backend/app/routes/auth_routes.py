from fastapi import APIRouter

from app.services import auth_service
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(payload: dict):
    # TODO Backend Core Developer: Use UserCreate schema and database session.
    return success_response("User registered successfully", auth_service.register_user(payload))


@router.post("/login")
def login(payload: dict):
    # TODO Backend Core Developer: Validate login credentials and return JWT.
    return success_response("User logged in successfully", auth_service.login_user(payload))


@router.get("/me")
def me():
    # TODO Backend Core Developer: Protect this route with auth middleware.
    return success_response("Current user loaded", auth_service.get_current_user())
