import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "EduCloud Lite API")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/educloud_lite")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-development-secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ENABLE_DEV_AUTH: bool = env_flag("ENABLE_DEV_AUTH")
    DEV_INSTRUCTOR_USER_ID: int = int(os.getenv("DEV_INSTRUCTOR_USER_ID", "900001"))
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "educloud-lite-demo-bucket")


settings = Settings()
