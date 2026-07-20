import json
from functools import lru_cache
from urllib.request import urlopen

import boto3
from botocore import UNSIGNED
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.utils.security import create_access_token


def _require_configuration() -> None:
    if not settings.COGNITO_ISSUER or not settings.COGNITO_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito is not configured")


@lru_cache(maxsize=1)
def _signing_keys() -> dict[str, dict]:
    _require_configuration()
    try:
        with urlopen(f"{settings.COGNITO_ISSUER}/.well-known/jwks.json", timeout=5) as response:  # noqa: S310
            payload = json.load(response)
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to load Cognito signing keys") from error
    return {key["kid"]: key for key in payload.get("keys", [])}


@lru_cache(maxsize=1)
def _cognito_client():
    _require_configuration()
    return boto3.client(
        "cognito-idp",
        region_name=settings.COGNITO_REGION,
        config=Config(signature_version=UNSIGNED),
    )


def verify_id_token(id_token: str) -> dict:
    _require_configuration()
    try:
        header = jwt.get_unverified_header(id_token)
        signing_key = _signing_keys().get(header.get("kid"))
        if not signing_key:
            _signing_keys.cache_clear()
            signing_key = _signing_keys().get(header.get("kid"))
        if not signing_key:
            raise ValueError("Unknown Cognito signing key")
        claims = jwt.decode(
            id_token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.COGNITO_CLIENT_ID,
            issuer=settings.COGNITO_ISSUER,
        )
        if claims.get("token_use") != "id":
            raise ValueError("Cognito ID token required")
        if claims.get("email_verified") is not True:
            raise ValueError("Confirm your email before signing in")
        return claims
    except (JWTError, KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error) or "Invalid Cognito token") from error


def exchange_token(db: Session, id_token: str) -> dict:
    claims = verify_id_token(id_token)
    subject = claims.get("sub")
    email = str(claims.get("email", "")).strip().lower()
    full_name = str(claims.get("name") or email.split("@", 1)[0]).strip()
    if not subject or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cognito token is missing identity claims")

    user = db.query(User).filter(User.cognito_sub == subject).first()
    if user is None:
        # Attach an existing Supabase account by verified email during migration.
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(full_name=full_name, email=email, role="student", cognito_sub=subject)
            db.add(user)
        else:
            user.cognito_sub = subject
            if full_name:
                user.full_name = full_name
        db.commit()
        db.refresh(user)

    return {"token": create_access_token(user.id, user.role), "user": user}


def request_password_reset(db: Session, email: str) -> bool:
    """Send a Cognito reset code only for an identity linked to the app database.

    The route intentionally exposes the same response whether a matching account
    exists or not, preventing account enumeration through the EduCloud API.
    """
    _require_configuration()
    normalized_email = email.strip().lower()
    user = db.query(User).filter(
        User.email == normalized_email,
        User.cognito_sub.is_not(None),
    ).first()
    if user is None:
        return False
    try:
        _cognito_client().forgot_password(
            ClientId=settings.COGNITO_CLIENT_ID,
            Username=normalized_email,
        )
        return True
    except ClientError:
        # Do not reveal whether Cognito rejected a specific account or delivery.
        return False
