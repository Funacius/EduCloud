from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class InstructorRequest(Base):
    __tablename__ = "instructor_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    organization = Column(String(160), nullable=False)
    expertise = Column(String(240), nullable=False)
    experience = Column(Text, nullable=False)
    bio = Column(Text, nullable=False)
    portfolio_url = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    review_note = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
