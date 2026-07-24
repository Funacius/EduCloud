from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CourseAssessment(Base):
    __tablename__ = "course_assessments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, unique=True, index=True)
    title = Column(String(200), nullable=False, default="Final assessment")
    instructions = Column(Text, nullable=True)
    time_limit_minutes = Column(Integer, nullable=False, default=20)
    passing_score = Column(Integer, nullable=False, default=70)
    max_attempts = Column(Integer, nullable=False, default=3)
    is_published = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    course = relationship("Course", back_populates="assessment")
    questions = relationship(
        "AssessmentQuestion",
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="AssessmentQuestion.order_index",
    )
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("course_assessments.id"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    options = Column(JSON, nullable=False, default=list)
    correct_option_index = Column(Integer, nullable=False)
    correct_option_indices = Column(JSON, nullable=False, default=list)
    answer_mode = Column(String(20), nullable=False, default="all")
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    assessment = relationship("CourseAssessment", back_populates="questions")

    @property
    def normalized_correct_option_indices(self) -> list[int]:
        values = self.correct_option_indices or []
        if not values and self.correct_option_index is not None:
            values = [self.correct_option_index]
        return sorted({int(value) for value in values})

    @property
    def allows_multiple(self) -> bool:
        return self.answer_mode == "all" and len(self.normalized_correct_option_indices) > 1


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    __table_args__ = (
        UniqueConstraint("assessment_id", "user_id", "attempt_number", name="uq_assessment_user_attempt"),
    )

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("course_assessments.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False)
    answers = Column(JSON, nullable=False, default=dict)
    score = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    assessment = relationship("CourseAssessment", back_populates="attempts")
