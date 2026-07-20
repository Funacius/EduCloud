from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_certificate_user_course"),)

    id = Column(Integer, primary_key=True, index=True)
    certificate_code = Column(String(36), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_name = Column(String(120), nullable=False)
    course_title = Column(String(200), nullable=False)
    file_url = Column(String, nullable=True)
    issued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    profile = relationship("StudentProfile", back_populates="certificates")
