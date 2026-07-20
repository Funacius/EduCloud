from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.certificate import Certificate
from app.models.lesson import Lesson
from app.models.assessment import CourseAssessment
from app.schemas.course_schema import CourseCreate, CourseUpdate
from app.utils.authorization import require_course_owner_or_admin, require_instructor


def list_courses(db: Session) -> list[Course]:
    return (
        db.query(Course)
        .filter(Course.status == "published")
        .order_by(Course.created_at.desc())
        .all()
    )


def list_instructor_courses(db: Session, current_user: dict) -> list[Course]:
    require_instructor(current_user)
    return (
        db.query(Course)
        .filter(Course.instructor_id == current_user["user_id"])
        .order_by(Course.updated_at.desc())
        .all()
    )


def list_instructor_course_summaries(db: Session, current_user: dict) -> list[dict]:
    courses = list_instructor_courses(db, current_user)
    course_ids = [course.id for course in courses]
    enrollment_pairs = set(
        db.query(Enrollment.course_id, Enrollment.user_id)
        .filter(Enrollment.course_id.in_(course_ids))
        .all()
    ) if course_ids else set()
    enrolled = {
        course_id: sum(1 for pair_course_id, _ in enrollment_pairs if pair_course_id == course_id)
        for course_id in course_ids
    }
    completed = dict(
        db.query(Certificate.course_id, func.count(Certificate.id))
        .filter(Certificate.course_id.in_(course_ids))
        .group_by(Certificate.course_id)
        .all()
    ) if course_ids else {}
    return [
        {
            **{column.name: getattr(course, column.name) for column in Course.__table__.columns},
            "enrolled_students": enrolled.get(course.id, 0),
            "completed_students": completed.get(course.id, 0),
        }
        for course in courses
    ]


def get_course(db: Session, course_id: int) -> Course:
    course = (
        db.query(Course)
        .options(joinedload(Course.lessons))
        .filter(Course.id == course_id)
        .first()
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def get_public_course(db: Session, course_id: int) -> Course:
    course = get_course(db, course_id)
    if course.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    for lesson in course.lessons:
        lesson.has_video = bool(lesson.video_url)
    return course


def get_managed_course(db: Session, course_id: int, current_user: dict) -> Course:
    course = get_course(db, course_id)
    require_course_owner_or_admin(course, current_user)
    return course


def get_learning_course(db: Session, course_id: int, current_user: dict) -> Course:
    course = get_course(db, course_id)
    if current_user.get("role") == "admin" or course.instructor_id == current_user.get("user_id"):
        return course
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    enrolled = db.query(Enrollment.id).filter_by(user_id=current_user["user_id"], course_id=course_id).first()
    if enrolled is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enroll in this course before viewing lesson content")
    return course


def _ensure_publishable(db: Session, course_id: int) -> None:
    has_lesson = db.query(Lesson.id).filter(Lesson.course_id == course_id).first()
    assessment = db.query(CourseAssessment).filter_by(course_id=course_id, is_published=True).first()
    if has_lesson is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Add at least one lesson before publishing the course")
    if assessment is None or not assessment.questions:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Publish a final assessment before publishing the course")


def create_course(db: Session, payload: CourseCreate, current_user: dict) -> Course:
    require_instructor(current_user)

    if payload.status == "published":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Create the course as a draft, then add lessons and a final assessment before publishing")

    course = Course(**payload.model_dump(), instructor_id=current_user["user_id"])
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_course(db: Session, course_id: int, payload: CourseUpdate, current_user: dict) -> Course:
    course = get_course(db, course_id)
    require_course_owner_or_admin(course, current_user)

    if payload.status == "published":
        _ensure_publishable(db, course_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course_id: int, current_user: dict) -> None:
    course = get_course(db, course_id)
    require_course_owner_or_admin(course, current_user)
    if db.query(Enrollment.id).filter(Enrollment.course_id == course_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Courses with enrolled students cannot be deleted; hide the course instead")
    db.delete(course)
    db.commit()
