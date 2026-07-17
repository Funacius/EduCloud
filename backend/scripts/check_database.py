from sqlalchemy import text

from app.database import engine


def main() -> None:
    with engine.connect() as connection:
        if engine.dialect.name == "postgresql":
            database_name, database_user = connection.execute(
                text("select current_database(), current_user")
            ).one()
            print(f"Connected to PostgreSQL database={database_name}, user={database_user}")
            return

        connection.execute(text("select 1")).scalar_one()
        safe_url = engine.url.render_as_string(hide_password=True)
        print(f"Connected using dialect={engine.dialect.name}, url={safe_url}")


if __name__ == "__main__":
    main()
