from pydantic import BaseModel, ConfigDict, Field


class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str | None = None
    video_url: str | None = None
    material_url: str | None = None
    order_index: int = Field(default=0, ge=0)


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None
    video_url: str | None = None
    material_url: str | None = None
    order_index: int | None = Field(default=None, ge=0)


class LessonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    content: str | None = None
    video_url: str | None = None
    material_url: str | None = None
    order_index: int


class LessonOutlineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    order_index: int
    has_video: bool = False
