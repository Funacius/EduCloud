from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import LoginRequest, UserCreate
from app.utils.security import create_access_token, hash_password, verify_password


def _normalized_email(email: str) -> str:
    return email.strip().lower()


def register_user(db: Session, payload: UserCreate) -> User:
    email = _normalized_email(str(payload.email))
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    user = User(full_name=payload.full_name.strip(), email=email, role="student", password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, payload: LoginRequest) -> dict:
    user = db.query(User).filter(User.email == _normalized_email(str(payload.email))).first()
    if user is None or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect")
    return {"token": create_access_token(user.id, user.role), "user": user}


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account no longer exists")
    return user
