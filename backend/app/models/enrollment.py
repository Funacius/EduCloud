from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class Enrollment(Base):
    # TODO Backend Business Logic Developer: Add unique enrollment constraint and timestamps.
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    status = Column(String, default="active")
