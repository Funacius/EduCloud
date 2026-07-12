from pydantic import BaseModel


class CourseCreate(BaseModel):
    # TODO Backend Business Logic Developer: Add course validation and instructor ownership.
    title: str
    description: str | None = None
    thumbnail_url: str | None = None


class CourseRead(CourseCreate):
    id: int
