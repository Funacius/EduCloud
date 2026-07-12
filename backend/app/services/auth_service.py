from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token
from app.schemas.user_schema import UserCreate, UserLogin # Giả định schema đã có sẵn

def register_user(db: Session, payload: UserCreate) -> dict:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký.")

    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"id": new_user.id, "email": new_user.email, "role": new_user.role}

def login_user(db: Session, payload: UserLogin) -> dict:
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}