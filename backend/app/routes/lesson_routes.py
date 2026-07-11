"""API boundary cho Lesson.

Route chịu trách nhiệm chuyển public ID/camelCase của frontend sang
integer ID/snake_case cho service. Query, ownership, transaction, kiểm tra
thứ tự và archive thuộc trách nhiệm của Lesson service.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import AppError
from app.middleware.auth_middleware import CurrentUser, require_roles
from app.schemas.lesson_schema import (
    LessonArchiveResponse,
    LessonCreate,
    LessonListResponse,
    LessonResponse,
    LessonUpdate,
)
from app.services import lesson_service
from app.utils.public_id import parse_public_id
from app.utils.response import success_response


router = APIRouter(tags=["Lessons"])


@router.get(
    "/courses/{course_id}/lessons",
    response_model=LessonListResponse,
    response_model_by_alias=True,
)
def list_lessons(course_id: str, db: Session = Depends(get_db)):
    """Trả về dữ liệu Lesson[] public cho Learning Page của frontend."""
    internal_id = parse_public_id(course_id, "course")
    result = lesson_service.list_public_course_lessons(db, course_id=internal_id)
    return success_response("Lessons loaded", result)


@router.post(
    "/courses/{course_id}/lessons",
    response_model=LessonResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def create_lesson(
    course_id: str,
    payload: LessonCreate,
    actor: CurrentUser = Depends(require_roles("instructor", "admin")),
    db: Session = Depends(get_db),
):
    """Tạo bài học sau khi service kiểm tra quyền sở hữu khóa học."""
    internal_id = parse_public_id(course_id, "course")
    result = lesson_service.create_lesson(
        db,
        course_id=internal_id,
        payload=payload.model_dump(mode="python", by_alias=False),
        actor=actor,
    )
    return success_response("Lesson created", result)


@router.put(
    "/lessons/{lesson_id}",
    response_model=LessonResponse,
    response_model_by_alias=True,
)
def update_lesson(
    lesson_id: str,
    payload: LessonUpdate,
    actor: CurrentUser = Depends(require_roles("instructor", "admin")),
    db: Session = Depends(get_db),
):
    """Cập nhật các field được gửi sau khi kiểm tra quyền sở hữu."""
    changes = payload.model_dump(
        mode="python",
        exclude_unset=True,
        by_alias=False,
    )
    if not changes:
        raise AppError(
            status_code=400,
            message="No fields to update",
            error_code="VALIDATION_ERROR",
        )

    internal_id = parse_public_id(lesson_id, "lesson")
    result = lesson_service.update_lesson(
        db,
        lesson_id=internal_id,
        payload=changes,
        actor=actor,
    )
    return success_response("Lesson updated", result)


@router.delete(
    "/lessons/{lesson_id}",
    response_model=LessonArchiveResponse,
    response_model_by_alias=True,
)
def delete_lesson(
    lesson_id: str,
    actor: CurrentUser = Depends(require_roles("instructor", "admin")),
    db: Session = Depends(get_db),
):
    """Archive bài học mà không xóa lịch sử tiến độ liên quan."""
    internal_id = parse_public_id(lesson_id, "lesson")
    result = lesson_service.archive_lesson(
        db,
        lesson_id=internal_id,
        actor=actor,
    )
    return success_response("Lesson archived", result)
