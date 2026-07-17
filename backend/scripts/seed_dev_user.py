from app import models  # noqa: F401
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models.user import User


def main() -> None:
    if settings.APP_ENV != "development" or not settings.ENABLE_DEV_AUTH:
        raise RuntimeError(
            "Set APP_ENV=development and ENABLE_DEV_AUTH=true before seeding."
        )

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.get(User, settings.DEV_INSTRUCTOR_USER_ID)
        if user is None:
            user = User(
                id=settings.DEV_INSTRUCTOR_USER_ID,
                full_name="EduCloud Dev Instructor",
                email="dev-instructor@educloud.local",
                role="instructor",
            )
            db.add(user)
        else:
            user.full_name = "EduCloud Dev Instructor"
            user.email = "dev-instructor@educloud.local"
            user.role = "instructor"

        db.commit()
        print(
            "Development instructor ready: "
            f"id={user.id}, email={user.email}, role={user.role}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
