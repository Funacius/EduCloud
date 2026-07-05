from pydantic import BaseModel


class LessonCreate(BaseModel):
    # TODO Backend Business Logic Developer: Add lesson ordering and material validation.
    title: str
    content: str | None = None
    video_url: str | None = None


class LessonRead(LessonCreate):
    id: int
    course_id: int
