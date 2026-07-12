from sqlalchemy import Boolean, Column, ForeignKey, Integer

from app.database import Base


class Progress(Base):
    # TODO Backend Business Logic Developer: Track completed lessons and calculate course progress.
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    is_completed = Column(Boolean, default=False)
