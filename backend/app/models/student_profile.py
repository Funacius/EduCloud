from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    certificate_name = Column(String(120), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    organization = Column(String(160), nullable=True)
    country = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    certificates = relationship("Certificate", back_populates="profile", cascade="all, delete-orphan")
