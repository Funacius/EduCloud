def hash_password(password: str) -> str:
    # TODO Backend Core Developer: Replace with passlib bcrypt hashing.
    return f"hashed-{password}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # TODO Backend Core Developer: Replace with secure password verification.
    return hashed_password == f"hashed-{plain_password}"
