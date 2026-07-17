import pytest
from fastapi import HTTPException

from app.config import settings
from app.middleware.auth_middleware import get_current_user_from_token


def test_dev_instructor_token_is_opt_in(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "development")
    monkeypatch.setattr(settings, "ENABLE_DEV_AUTH", False)
    with pytest.raises(HTTPException) as error:
        get_current_user_from_token("dev-instructor-token")
    assert error.value.status_code == 401

    monkeypatch.setattr(settings, "ENABLE_DEV_AUTH", True)
    actor = get_current_user_from_token("dev-instructor-token")

    assert actor["role"] == "instructor"
    assert actor["user_id"] == settings.DEV_INSTRUCTOR_USER_ID
