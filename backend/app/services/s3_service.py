import shutil
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile, status

from app.config import settings


def save_upload(
    upload: UploadFile,
    *,
    category: str,
    course_id: int,
    allowed_extensions: set[str],
    max_bytes: int,
) -> dict:
    original_name = upload.filename or "upload"
    extension = Path(original_name).suffix.lower()
    if extension not in allowed_extensions:
        allowed = ", ".join(sorted(allowed_extensions))
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Allowed types: {allowed}",
        )

    size = upload.size
    if size is None:
        upload.file.seek(0, 2)
        size = upload.file.tell()
        upload.file.seek(0)
    if size > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Maximum size is {limit_mb} MB.",
        )

    stored_name = f"{uuid4().hex}{extension}"
    if settings.UPLOAD_STORAGE.lower() == "s3":
        return _save_to_s3(upload, category, course_id, stored_name, original_name, size)
    return _save_locally(upload, category, course_id, stored_name, original_name, size)


def _save_locally(
    upload: UploadFile,
    category: str,
    course_id: int,
    stored_name: str,
    original_name: str,
    size: int,
) -> dict:
    root = Path(settings.LOCAL_UPLOAD_DIR).resolve()
    destination = root / category / str(course_id)
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / stored_name

    upload.file.seek(0)
    with target.open("wb") as output:
        shutil.copyfileobj(upload.file, output)

    relative_path = target.relative_to(root).as_posix()
    url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/uploads/{quote(relative_path)}"
    return {
        "url": url,
        "filename": original_name,
        "content_type": upload.content_type or "application/octet-stream",
        "size": size,
        "storage": "local",
    }


def _save_to_s3(
    upload: UploadFile,
    category: str,
    course_id: int,
    stored_name: str,
    original_name: str,
    size: int,
) -> dict:
    key = f"courses/{course_id}/{category}/{stored_name}"
    client = boto3.client("s3", region_name=settings.AWS_REGION)
    try:
        upload.file.seek(0)
        client.upload_fileobj(
            upload.file,
            settings.AWS_S3_BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": upload.content_type or "application/octet-stream"},
        )
    except (BotoCoreError, ClientError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to upload the file to Amazon S3.",
        ) from error

    base_url = settings.AWS_S3_PUBLIC_BASE_URL.rstrip("/") or (
        f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com"
    )
    return {
        "url": f"{base_url}/{quote(key)}",
        "filename": original_name,
        "content_type": upload.content_type or "application/octet-stream",
        "size": size,
        "storage": "s3",
    }
