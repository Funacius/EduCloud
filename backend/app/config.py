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
    COGNITO_REGION: str = os.getenv("COGNITO_REGION", "")
    COGNITO_USER_POOL_ID: str = os.getenv("COGNITO_USER_POOL_ID", "")
    COGNITO_CLIENT_ID: str = os.getenv("COGNITO_CLIENT_ID", "")
    ALLOW_LEGACY_AUTH: bool = env_flag("ALLOW_LEGACY_AUTH", True)
    ENABLE_DEV_AUTH: bool = env_flag("ENABLE_DEV_AUTH")
    DEV_INSTRUCTOR_USER_ID: int = int(os.getenv("DEV_INSTRUCTOR_USER_ID", "900001"))
    CORS_ORIGINS: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    )
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "educloud-lite-demo-bucket")
    AWS_S3_PUBLIC_BASE_URL: str = os.getenv("AWS_S3_PUBLIC_BASE_URL", "")
    AWS_MONITORING_ENABLED: bool = env_flag("AWS_MONITORING_ENABLED")
    UPLOAD_STORAGE: str = os.getenv("UPLOAD_STORAGE", "local")
    LOCAL_UPLOAD_DIR: str = os.getenv("LOCAL_UPLOAD_DIR", "uploads")
    PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL", "http://127.0.0.1:8001")

    @property
    def COGNITO_ISSUER(self) -> str:
        if not self.COGNITO_REGION or not self.COGNITO_USER_POOL_ID:
            return ""
        return f"https://cognito-idp.{self.COGNITO_REGION}.amazonaws.com/{self.COGNITO_USER_POOL_ID}"


settings = Settings()
