"""API boundary cho Course.

Route chịu trách nhiệm chuyển public ID/camelCase của frontend sang
integer ID/snake_case cho service. Query, ownership, transaction và archive
thuộc trách nhiệm của Course service.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import AppError
from app.middleware.auth_middleware import CurrentUser, require_roles
from app.schemas.course_schema import (
    CourseArchiveResponse,
    CourseCreate,
    CourseDetailResponse,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
)
from app.services import course_service
from app.utils.public_id import parse_public_id
from app.utils.response import success_response


router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get(
    "",
    response_model=CourseListResponse,
    response_model_by_alias=True,
)
def list_courses(
    q: str | None = Query(default=None, min_length=1, max_length=100),
    db: Session = Depends(get_db),
):
    """Trả về các khóa học đã phát hành theo dạng Course[] của frontend."""
    result = course_service.list_public_courses(
        db,
        query=q.strip() if q else None,
    )
    return success_response("Courses loaded", result)


@router.get(
    "/{course_id}",
    response_model=CourseDetailResponse,
    response_model_by_alias=True,
)
def get_course(course_id: str, db: Session = Depends(get_db)):
    """Trả về dữ liệu CourseDetail cho frontend từ public course ID."""
    internal_id = parse_public_id(course_id, "course")
    result = course_service.get_public_course_detail(db, course_id=internal_id)
    return success_response("Course loaded", result)


@router.post(
    "",
    response_model=CourseResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    payload: CourseCreate,
    actor: CurrentUser = Depends(require_roles("instructor", "admin")),
    db: Session = Depends(get_db),
):
    """Tạo khóa học đã phát hành thuộc instructor/admin đã xác thực."""
    result = course_service.create_course(
        db,
        payload=payload.model_dump(mode="python", by_alias=False),
        actor=actor,
    )
    return success_response("Course created", result)


@router.put(
    "/{course_id}",
    response_model=CourseResponse,
    response_model_by_alias=True,
)
def update_course(
    course_id: str,
    payload: CourseUpdate,
    actor: CurrentUser = Depends(require_roles("instructor", "admin")),
    db: Session = Depends(get_db),
):
    """Chỉ cập nhật các field được gửi sau khi service kiểm tra quyền sở hữu."""
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

    internal_id = parse_public_id(course_id, "course")
    result = course_service.update_course(
        db,
        course_id=internal_id,
        payload=changes,
        actor=actor,
    )
    return success_response("Course updated", result)


@router.delete(
    "/{course_id}",
    response_model=CourseArchiveResponse,
    response_model_by_alias=True,
)
def delete_course(
    course_id: str,
    actor: CurrentUser = Depends(require_roles("instructor", "admin")),
    db: Session = Depends(get_db),
):
    """Archive khóa học thay vì xóa lịch sử học tập."""
    internal_id = parse_public_id(course_id, "course")
    result = course_service.archive_course(
        db,
        course_id=internal_id,
        actor=actor,
    )
    return success_response("Course archived", result)
