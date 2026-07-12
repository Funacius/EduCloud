from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# TODO Backend Core Developer: Configure PostgreSQL/RDS connection pooling and migrations.
engine = create_engine(
    "sqlite:///./educloud.db", 
    connect_args={"check_same_thread": False},
    echo=settings.APP_ENV == "development"
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    # TODO Backend Core Developer: Use this dependency in routes when database logic is implemented.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
