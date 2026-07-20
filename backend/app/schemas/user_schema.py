from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EMAIL_PATTERN = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=8, max_length=72)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: Literal["student", "instructor", "admin"]


class LoginRequest(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=1, max_length=72)


class AuthResult(BaseModel):
    token: str
    user: UserRead


class CognitoExchangeRequest(BaseModel):
    id_token: str = Field(min_length=100)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
