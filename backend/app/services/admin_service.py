from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.instructor_request import InstructorRequest
from app.models.lesson import Lesson
from app.models.user import User
from app.models.certificate import Certificate
from app.models.assessment import AssessmentQuestion, CourseAssessment


def get_dashboard(db: Session, current_user: dict) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    role_counts = dict(db.query(User.role, func.count(User.id)).group_by(User.role).all())
    course_counts = dict(db.query(Course.status, func.count(Course.id)).group_by(Course.status).all())
    recent_users = db.query(User).order_by(User.id.desc()).limit(10).all()
    return {
        "total_users": sum(role_counts.values()),
        "students": role_counts.get("student", 0),
        "instructors": role_counts.get("instructor", 0),
        "admins": role_counts.get("admin", 0),
        "published_courses": course_counts.get("published", 0),
        "draft_courses": course_counts.get("draft", 0),
        "total_lessons": db.query(func.count(Lesson.id)).scalar() or 0,
        "total_enrollments": db.query(func.count(Enrollment.id)).scalar() or 0,
        "pending_instructor_requests": db.query(func.count(InstructorRequest.id)).filter(InstructorRequest.status == "pending").scalar() or 0,
        "recent_users": [
            {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role}
            for user in recent_users
        ],
    }


def list_course_oversight(db: Session, current_user: dict) -> list[dict]:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    rows = (
        db.query(Course, User.full_name.label("instructor_name"))
        .join(User, User.id == Course.instructor_id)
        .order_by(Course.updated_at.desc())
        .all()
    )
    course_ids = [course.id for course, _ in rows]
    enrollment_counts = dict(
        db.query(Enrollment.course_id, func.count(Enrollment.id))
        .filter(Enrollment.course_id.in_(course_ids))
        .group_by(Enrollment.course_id)
        .all()
    ) if course_ids else {}
    certificate_counts = dict(
        db.query(Certificate.course_id, func.count(Certificate.id))
        .filter(Certificate.course_id.in_(course_ids))
        .group_by(Certificate.course_id)
        .all()
    ) if course_ids else {}
    lesson_counts = dict(
        db.query(Lesson.course_id, func.count(Lesson.id))
        .filter(Lesson.course_id.in_(course_ids))
        .group_by(Lesson.course_id)
        .all()
    ) if course_ids else {}
    assessment_rows = (
        db.query(CourseAssessment.course_id, CourseAssessment.id, CourseAssessment.is_published)
        .filter(CourseAssessment.course_id.in_(course_ids))
        .all()
    ) if course_ids else []
    assessments = {
        course_id: {"id": assessment_id, "is_published": is_published}
        for course_id, assessment_id, is_published in assessment_rows
    }
    assessment_ids = [row[1] for row in assessment_rows]
    question_counts = dict(
        db.query(AssessmentQuestion.assessment_id, func.count(AssessmentQuestion.id))
        .filter(AssessmentQuestion.assessment_id.in_(assessment_ids))
        .group_by(AssessmentQuestion.assessment_id)
        .all()
    ) if assessment_ids else {}

    def publish_blockers(course_id: int) -> list[str]:
        blockers: list[str] = []
        if lesson_counts.get(course_id, 0) == 0:
            blockers.append("Add at least one lesson.")
        assessment = assessments.get(course_id)
        if not assessment or not assessment["is_published"] or question_counts.get(assessment["id"], 0) == 0:
            blockers.append("Publish a final assessment with at least one question.")
        return blockers

    return [{
        "id": course.id,
        "title": course.title,
        "status": course.status,
        "instructor_name": instructor_name,
        "enrollments": enrollment_counts.get(course.id, 0),
        "certificates": certificate_counts.get(course.id, 0),
        "can_publish": not publish_blockers(course.id),
        "publish_blockers": publish_blockers(course.id),
        "updated_at": course.updated_at,
    } for course, instructor_name in rows]
