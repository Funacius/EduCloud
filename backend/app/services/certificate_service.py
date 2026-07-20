from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.assessment import AssessmentAttempt, CourseAssessment
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.student_profile import StudentProfile
from app.models.user import User


def issue_if_course_completed(db: Session, user_id: int, course_id: int) -> Certificate | None:
    total = db.query(func.count(Lesson.id)).filter(Lesson.course_id == course_id).scalar() or 0
    if total == 0:
        return None
    completed = db.query(func.count(Progress.id)).filter(
        Progress.user_id == user_id,
        Progress.course_id == course_id,
        Progress.is_completed.is_(True),
    ).scalar() or 0
    if completed < total:
        return None

    assessment = db.query(CourseAssessment).filter_by(course_id=course_id, is_published=True).first()
    if assessment is None:
        return None
    passed = db.query(AssessmentAttempt.id).filter(
        AssessmentAttempt.assessment_id == assessment.id,
        AssessmentAttempt.user_id == user_id,
        AssessmentAttempt.passed.is_(True),
    ).first()
    if passed is None:
        return None

    existing = db.query(Certificate).filter_by(user_id=user_id, course_id=course_id).first()
    if existing:
        return existing
    user = db.get(User, user_id)
    course = db.get(Course, course_id)
    if not user or not course:
        return None
    profile = db.query(StudentProfile).filter_by(user_id=user_id).first()
    if profile is None:
        profile = StudentProfile(user_id=user_id, certificate_name=user.full_name)
        db.add(profile)
        db.flush()
    certificate = Certificate(
        certificate_code=str(uuid4()),
        user_id=user_id,
        profile_id=profile.id,
        course_id=course_id,
        recipient_name=profile.certificate_name,
        course_title=course.title,
    )
    db.add(certificate)
    enrollment = db.query(Enrollment).filter_by(user_id=user_id, course_id=course_id).first()
    if enrollment:
        enrollment.status = "completed"
    db.flush()
    return certificate
