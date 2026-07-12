import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "EduCloud Lite API")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/educloud_lite")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-development-secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "educloud-lite-demo-bucket")


settings = Settings()
