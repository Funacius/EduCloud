from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class StudentProfileUpdate(BaseModel):
    certificate_name: str = Field(min_length=2, max_length=120)
    date_of_birth: date | None = None
    organization: str | None = Field(default=None, max_length=160)
    country: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=1000)


class CertificateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    certificate_code: str
    course_id: int
    recipient_name: str
    course_title: str
    file_url: str | None
    issued_at: datetime


class StudentProfileRead(BaseModel):
    id: int | None = None
    user_id: int
    email: str
    full_name: str
    certificate_name: str
    date_of_birth: date | None = None
    organization: str | None = None
    country: str | None = None
    bio: str | None = None
    is_complete: bool
    certificates: list[CertificateRead] = Field(default_factory=list)
