from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class InstructorRequestCreate(BaseModel):
    organization: str = Field(min_length=2, max_length=160)
    expertise: str = Field(min_length=2, max_length=240)
    experience: str = Field(min_length=10, max_length=2000)
    bio: str = Field(min_length=10, max_length=2000)
    portfolio_url: str | None = Field(default=None, max_length=500)

    @field_validator("organization", "expertise", "experience", "bio", mode="before")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("portfolio_url", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) and value.strip() else None


class InstructorRequestReview(BaseModel):
    review_note: str | None = Field(default=None, max_length=1000)


class InstructorRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    applicant_name: str
    applicant_email: str
    organization: str
    expertise: str
    experience: str
    bio: str
    portfolio_url: str | None
    status: Literal["pending", "approved", "rejected"]
    review_note: str | None
    reviewed_by: int | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
