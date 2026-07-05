from sqlalchemy import Column, Integer, String

from app.database import Base


class User(Base):
    # TODO Backend Core Developer: Add password hash, roles, timestamps, and relationships.
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="student")
