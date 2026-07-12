from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Course(Base):
    # TODO Backend Business Logic Developer: Add instructor relationship, price/status, and timestamps.
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String, nullable=True)
