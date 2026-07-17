from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Keep stale Supabase/Supavisor connections from being handed to a request.
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
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
