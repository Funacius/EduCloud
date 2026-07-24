from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.datastructures import Headers

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services.course_service import get_course
from app.services.remote_image_service import download_remote_image
from app.services.s3_service import save_upload
from app.utils.authorization import require_course_owner_or_admin
from app.utils.response import success_response

router = APIRouter(prefix="/upload", tags=["Upload"])

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
MATERIAL_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".zip"}


class ThumbnailUrlImport(BaseModel):
    course_id: int
    url: str


def _authorize_course(db: Session, course_id: int, current_user: dict) -> None:
    course = get_course(db, course_id)
    require_course_owner_or_admin(course, current_user)


@router.post("/course-thumbnail")
def upload_course_thumbnail(
    course_id: Annotated[int, Form()],
    file: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _authorize_course(db, course_id, current_user)
    result = save_upload(
        file,
        category="thumbnails",
        course_id=course_id,
        allowed_extensions=IMAGE_EXTENSIONS,
        max_bytes=10 * 1024 * 1024,
    )
    return success_response("Course thumbnail uploaded", result)


@router.post("/course-thumbnail/import")
def import_course_thumbnail(
    payload: ThumbnailUrlImport,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _authorize_course(db, payload.course_id, current_user)
    data, content_type, extension = download_remote_image(payload.url)
    upload = UploadFile(
        file=BytesIO(data),
        size=len(data),
        filename=f"imported-thumbnail{extension}",
        headers=Headers({"content-type": content_type}),
    )
    result = save_upload(
        upload,
        category="thumbnails",
        course_id=payload.course_id,
        allowed_extensions=IMAGE_EXTENSIONS,
        max_bytes=10 * 1024 * 1024,
    )
    return success_response("Remote course thumbnail imported", result)


@router.post("/lesson-material")
def upload_lesson_material(
    course_id: Annotated[int, Form()],
    file: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _authorize_course(db, course_id, current_user)
    result = save_upload(
        file,
        category="materials",
        course_id=course_id,
        allowed_extensions=MATERIAL_EXTENSIONS,
        max_bytes=50 * 1024 * 1024,
    )
    return success_response("Lesson material uploaded", result)


@router.post("/video")
def upload_video(
    course_id: Annotated[int, Form()],
    file: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _authorize_course(db, course_id, current_user)
    result = save_upload(
        file,
        category="videos",
        course_id=course_id,
        allowed_extensions=VIDEO_EXTENSIONS,
        max_bytes=500 * 1024 * 1024,
    )
    return success_response("Video uploaded", result)
