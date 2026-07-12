from fastapi import APIRouter

from app.services.s3_service import upload_file_placeholder
from app.utils.response import success_response

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/course-thumbnail")
def upload_course_thumbnail():
    # TODO API Developer - Enrollment, Upload & Testing: Accept UploadFile and store in S3.
    return success_response("Course thumbnail uploaded", upload_file_placeholder("course-thumbnail"))


@router.post("/lesson-material")
def upload_lesson_material():
    # TODO API Developer - Enrollment, Upload & Testing: Accept lesson material file and store in S3.
    return success_response("Lesson material uploaded", upload_file_placeholder("lesson-material"))


@router.post("/video")
def upload_video():
    # TODO API Developer - Enrollment, Upload & Testing: Accept lesson video and store in S3.
    return success_response("Video uploaded", upload_file_placeholder("video"))
