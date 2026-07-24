import logging

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


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
    with engine.begin() as connection:
        if "password_hash" not in existing:
            connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
        if "cognito_sub" not in existing:
            connection.execute(text("ALTER TABLE users ADD COLUMN cognito_sub VARCHAR(64)"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_cognito_sub ON users (cognito_sub)"))


def ensure_learning_unique_indexes(engine: Engine) -> None:
    """Protect enrollment/progress idempotency for databases created before model constraints existed."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    statements = []
    if "enrollments" in tables:
        statements.append("CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollment_user_course ON enrollments (user_id, course_id)")
    if "progress" in tables:
        statements.append("CREATE UNIQUE INDEX IF NOT EXISTS uq_progress_user_lesson ON progress (user_id, lesson_id)")
    for statement in statements:
        try:
            with engine.begin() as connection:
                connection.execute(text(statement))
        except SQLAlchemyError:
            logger.warning("Could not create a learning uniqueness index; check the table for duplicate rows", exc_info=True)


def ensure_assessment_answer_columns(engine: Engine) -> None:
    """Keep existing single-answer questions compatible with multi-answer assessments."""
    inspector = inspect(engine)
    if "assessment_questions" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("assessment_questions")}
    json_default = "'[]'::json" if engine.dialect.name == "postgresql" else "'[]'"
    with engine.begin() as connection:
        if "correct_option_indices" not in existing:
            connection.execute(text(
                f"ALTER TABLE assessment_questions "
                f"ADD COLUMN correct_option_indices JSON NOT NULL DEFAULT {json_default}"
            ))
        if "answer_mode" not in existing:
            connection.execute(text(
                "ALTER TABLE assessment_questions "
                "ADD COLUMN answer_mode VARCHAR(20) NOT NULL DEFAULT 'all'"
            ))

        if engine.dialect.name == "postgresql":
            connection.execute(text(
                "UPDATE assessment_questions "
                "SET correct_option_indices = json_build_array(correct_option_index) "
                "WHERE correct_option_indices::text = '[]'"
            ))
        elif engine.dialect.name == "sqlite":
            connection.execute(text(
                "UPDATE assessment_questions "
                "SET correct_option_indices = json_array(correct_option_index) "
                "WHERE correct_option_indices = '[]'"
            ))
