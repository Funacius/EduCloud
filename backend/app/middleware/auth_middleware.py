from fastapi import Header, HTTPException, status

from app.config import settings
from app.utils.security import decode_access_token


def get_current_user_from_token(token: str) -> dict:
    if (
        settings.APP_ENV == "development"
        and settings.ENABLE_DEV_AUTH
        and token == "dev-instructor-token"
    ):
        return {
            "token": token,
            "user_id": settings.DEV_INSTRUCTOR_USER_ID,
            "role": "instructor",
        }

    try:
        return decode_access_token(token)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    # Dependency wrapper for routes that need the caller's signed identity and role.
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ")
    return get_current_user_from_token(token)
