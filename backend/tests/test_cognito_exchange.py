from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base
from app.models.user import User
from app.services import cognito_service


def test_cognito_exchange_creates_student_and_attaches_existing_role(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    try:
        claims = {
            "sub": "cognito-new-student",
            "email": "new@example.com",
            "email_verified": True,
            "name": "New Student",
            "token_use": "id",
        }
        monkeypatch.setattr(cognito_service, "verify_id_token", lambda _: claims)
        result = cognito_service.exchange_token(db, "id-token")
        assert result["user"].role == "student"
        assert result["user"].cognito_sub == "cognito-new-student"
        assert result["token"]

        admin = User(full_name="Legacy Admin", email="admin@example.com", role="admin", password_hash="legacy")
        db.add(admin)
        db.commit()
        claims.update({"sub": "cognito-admin", "email": "admin@example.com", "name": "Cognito Admin"})
        migrated = cognito_service.exchange_token(db, "admin-id-token")
        assert migrated["user"].id == admin.id
        assert migrated["user"].role == "admin"
        assert migrated["user"].cognito_sub == "cognito-admin"
        assert db.query(User).count() == 2

        sent_to = []

        class FakeCognitoClient:
            def forgot_password(self, **kwargs):
                sent_to.append(kwargs)

        monkeypatch.setattr(cognito_service.settings, "COGNITO_REGION", "ap-southeast-1")
        monkeypatch.setattr(cognito_service.settings, "COGNITO_USER_POOL_ID", "ap-southeast-1_test")
        monkeypatch.setattr(cognito_service.settings, "COGNITO_CLIENT_ID", "test-client")
        monkeypatch.setattr(cognito_service, "_cognito_client", lambda: FakeCognitoClient())
        assert cognito_service.request_password_reset(db, "NEW@EXAMPLE.COM") is True
        assert sent_to == [{"ClientId": cognito_service.settings.COGNITO_CLIENT_ID, "Username": "new@example.com"}]
        assert cognito_service.request_password_reset(db, "missing@example.com") is False
        assert len(sent_to) == 1
    finally:
        db.close()
