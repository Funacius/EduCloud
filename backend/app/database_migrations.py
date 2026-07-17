from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_course_detail_columns(engine: Engine) -> None:
    """Keep existing development databases compatible until Alembic is introduced."""
    inspector = inspect(engine)
    if "courses" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("courses")}
    json_default = "'[]'::json" if engine.dialect.name == "postgresql" else "'[]'"
    definitions = {
        "level": "VARCHAR(50) NOT NULL DEFAULT 'All levels'",
        "category": "VARCHAR(100) NOT NULL DEFAULT 'EduCloud'",
        "learning_outcomes": f"JSON NOT NULL DEFAULT {json_default}",
        "requirements": f"JSON NOT NULL DEFAULT {json_default}",
    }

    with engine.begin() as connection:
        for column_name, definition in definitions.items():
            if column_name not in existing:
                connection.execute(text(f"ALTER TABLE courses ADD COLUMN {column_name} {definition}"))


def ensure_user_auth_columns(engine: Engine) -> None:
    """Add development auth columns to an existing users table."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("users")}
    if "password_hash" not in existing:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
