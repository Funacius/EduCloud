from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.config import settings

# Cấu hình bộ băm mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(days=1))
    to_encode.update({"exp": expire})
    # Tạo chuỗi JWT dựa trên SECRET_KEY từ file .env
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt