from app import models  # noqa: F401
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.database_migrations import ensure_user_auth_columns
from app.models.user import User
from app.utils.security import hash_password


ACCOUNTS = (
    (900000, "Alex Student", "student@educloud.local", "student"),
    (900001, "Morgan Instructor", "instructor@educloud.local", "instructor"),
    (900002, "Taylor Admin", "admin@educloud.local", "admin"),
    (900003, "EduCloud Backup Admin", "admin2@educloud.local", "admin"),
)


def main() -> None:
    if settings.APP_ENV != "development" or not settings.ENABLE_DEV_AUTH:
        raise RuntimeError("Set APP_ENV=development and ENABLE_DEV_AUTH=true before seeding.")
    Base.metadata.create_all(bind=engine)
    ensure_user_auth_columns(engine)
    db = SessionLocal()
    try:
        for user_id, full_name, email, role in ACCOUNTS:
            user = db.get(User, user_id) or User(id=user_id)
            user.full_name = full_name
            user.email = email
            user.role = role
            user.password_hash = hash_password("Demo123!")
            db.add(user)
        db.commit()
        print("Development student, instructor, and admin accounts are ready in Supabase.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
