from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String(50), nullable=False, default="All levels")
    category = Column(String(100), nullable=False, default="EduCloud")
    learning_outcomes = Column(JSON, nullable=False, default=list)
    requirements = Column(JSON, nullable=False, default=list)
    thumbnail_url = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, default=0)
    status = Column(String, nullable=False, default="draft")
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    lessons = relationship(
        "Lesson",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )
    assessment = relationship(
        "CourseAssessment",
        back_populates="course",
        cascade="all, delete-orphan",
        uselist=False,
    )
