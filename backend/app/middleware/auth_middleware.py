from fastapi import Header, HTTPException, status


def get_current_user_from_token(token: str) -> dict:
    # TODO Backend Core Developer: Decode JWT, validate role, and load user from database.
    return {"token": token, "user_id": 1, "role": "student"}


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    # FastAPI dependency wrapper for routes that need the caller's identity/role.
    # Still backed by the placeholder decode above until Backend Core Developer wires up real JWT auth.
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ")
    return get_current_user_from_token(token)
