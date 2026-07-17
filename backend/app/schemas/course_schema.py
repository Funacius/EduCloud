from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.lesson_schema import LessonRead


class CourseStatus(str, Enum):
    draft = "draft"
    published = "published"
    hidden = "hidden"
    archived = "archived"


class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    level: str = Field(default="All levels", min_length=2, max_length=50)
    category: str = Field(default="EduCloud", min_length=2, max_length=100)
    learning_outcomes: list[str] = Field(default_factory=list, max_length=20)
    requirements: list[str] = Field(default_factory=list, max_length=20)
    thumbnail_url: str | None = None
    price: float = Field(default=0, ge=0)
    status: CourseStatus = CourseStatus.draft


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    level: str | None = Field(default=None, min_length=2, max_length=50)
    category: str | None = Field(default=None, min_length=2, max_length=100)
    learning_outcomes: list[str] | None = Field(default=None, max_length=20)
    requirements: list[str] | None = Field(default=None, max_length=20)
    thumbnail_url: str | None = None
    price: float | None = Field(default=None, ge=0)
    status: CourseStatus | None = None


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    level: str
    category: str
    learning_outcomes: list[str]
    requirements: list[str]
    thumbnail_url: str | None = None
    price: float
    status: CourseStatus
    instructor_id: int
    created_at: datetime
    updated_at: datetime


class CourseDetail(CourseRead):
    lessons: list[LessonRead] = []
