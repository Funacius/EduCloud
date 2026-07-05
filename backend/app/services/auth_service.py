def register_user(payload: dict) -> dict:
    # TODO Backend Core Developer: Hash password, validate email, and save user.
    return {"user": payload}


def login_user(payload: dict) -> dict:
    # TODO Backend Core Developer: Verify password and return JWT token.
    return {"token": "placeholder-token"}


def get_current_user() -> dict:
    # TODO Backend Core Developer: Decode JWT and load user from database.
    return {"id": 1, "email": "student@example.com", "role": "student"}
