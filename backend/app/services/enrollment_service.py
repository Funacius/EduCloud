from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.certificate import Certificate
from app.models.assessment import AssessmentAttempt, CourseAssessment
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.user import User
from app.services.certificate_service import issue_if_course_completed


def enroll_course(db: Session, course_id: int, current_user: dict) -> Enrollment:
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    user_id = current_user["user_id"]
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if course.status != "published":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This course is not open for enrollment")
    assessment_ready = db.query(CourseAssessment.id).filter_by(course_id=course_id, is_published=True).first()
    if assessment_ready is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This course is waiting for its final assessment")
    enrollment = db.query(Enrollment).filter_by(user_id=user_id, course_id=course_id).first()
    if enrollment is None:
        enrollment = Enrollment(user_id=user_id, course_id=course_id, status="active")
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
    return enrollment


def get_student_dashboard(db: Session, user_id: int, role: str = "student") -> dict:
    if role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    enrollments = (
        db.query(Enrollment, Course, User.full_name.label("instructor_name"))
        .join(Course, Course.id == Enrollment.course_id)
        .join(User, User.id == Course.instructor_id)
        .filter(Enrollment.user_id == user_id)
        .order_by(Enrollment.id.desc())
        .all()
    )
    course_ids = [course.id for _, course, _ in enrollments]
    lesson_counts = dict(db.query(Lesson.course_id, func.count(Lesson.id)).filter(Lesson.course_id.in_(course_ids)).group_by(Lesson.course_id).all()) if course_ids else {}
    completed_counts = dict(
        db.query(Progress.course_id, func.count(Progress.id))
        .filter(Progress.user_id == user_id, Progress.is_completed.is_(True), Progress.course_id.in_(course_ids))
        .group_by(Progress.course_id).all()
    ) if course_ids else {}
    assessments = {
        assessment.course_id: assessment.id
        for assessment in db.query(CourseAssessment).filter(
            CourseAssessment.course_id.in_(course_ids),
            CourseAssessment.is_published.is_(True),
        ).all()
    } if course_ids else {}
    passed_assessment_ids = set(
        row[0] for row in db.query(AssessmentAttempt.assessment_id).filter(
            AssessmentAttempt.assessment_id.in_(list(assessments.values())),
            AssessmentAttempt.user_id == user_id,
            AssessmentAttempt.passed.is_(True),
        ).all()
    ) if assessments else set()

    # Opening the dashboard also backfills certificates for earlier completions.
    generated_certificate = False
    for course_id in course_ids:
        total_lessons = lesson_counts.get(course_id, 0)
        if total_lessons and completed_counts.get(course_id, 0) >= total_lessons:
            if issue_if_course_completed(db, user_id, course_id):
                generated_certificate = True
    if generated_certificate:
        db.commit()

    courses = []
    for enrollment, course, instructor_name in enrollments:
        total = lesson_counts.get(course.id, 0)
        completed = completed_counts.get(course.id, 0)
        percentage = round(completed * 100 / total) if total else 0
        courses.append({
            "id": course.id,
            "title": course.title,
            "instructor": instructor_name,
            "status": enrollment.status,
            "completed_lessons": completed,
            "total_lessons": total,
            "percentage": percentage,
            "assessment_required": course.id in assessments,
            "assessment_passed": assessments.get(course.id) in passed_assessment_ids,
            "ready_for_assessment": total > 0 and completed >= total and course.id in assessments,
        })

    completed_courses = db.query(func.count(Certificate.id)).filter(Certificate.user_id == user_id).scalar() or 0
    return {
        "active_courses": sum(1 for item in courses if item["status"] == "active"),
        "lessons_completed": sum(completed_counts.values()),
        "completed_courses": completed_courses,
        "courses": courses,
    }
