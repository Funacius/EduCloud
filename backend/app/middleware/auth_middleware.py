def get_current_user_from_token(token: str) -> dict:
    # TODO Backend Core Developer: Decode JWT, validate role, and load user from database.
    return {"token": token, "user_id": 1, "role": "student"}
