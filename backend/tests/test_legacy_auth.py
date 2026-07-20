import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base
from app.models.user import User
from app.schemas.user_schema import LoginRequest
from app.services.auth_service import login_user
from app.utils.security import hash_password


def test_legacy_login_allows_unlinked_dev_account_but_rejects_cognito_identity():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    try:
        legacy = User(
            full_name="Local Admin",
            email="admin2@educloud.local",
            role="admin",
            password_hash=hash_password("Demo123!"),
        )
        linked = User(
            full_name="Cognito Admin",
            email="admin@example.com",
            role="admin",
            password_hash=hash_password("Legacy123!"),
            cognito_sub="cognito-admin",
        )
        db.add_all([legacy, linked])
        db.commit()

        result = login_user(db, LoginRequest(email="ADMIN2@EDUCLOUD.LOCAL", password="Demo123!"))
        assert result["user"].id == legacy.id
        assert result["user"].role == "admin"

        with pytest.raises(HTTPException) as error:
            login_user(db, LoginRequest(email="admin@example.com", password="Legacy123!"))
        assert error.value.status_code == 401
    finally:
        db.close()
