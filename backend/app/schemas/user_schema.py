from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    # TODO Backend Core Developer: Add validation rules.
    full_name: str
    email: EmailStr
    password: str
    role: str = "student"


class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
