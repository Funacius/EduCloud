from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.database import Base


class Lesson(Base):
    # TODO Backend Business Logic Developer: Add lesson ordering, material URLs, and course relationship.
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    video_url = Column(String, nullable=True)
