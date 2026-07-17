from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.user import User


def enroll_course(db: Session, course_id: int, user_id: int) -> Enrollment:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    enrollment = db.query(Enrollment).filter_by(user_id=user_id, course_id=course_id).first()
    if enrollment is None:
        enrollment = Enrollment(user_id=user_id, course_id=course_id, status="active")
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
    return enrollment


def get_student_dashboard(db: Session, user_id: int) -> dict:
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
        })

    completed_courses = sum(1 for item in courses if item["total_lessons"] > 0 and item["completed_lessons"] >= item["total_lessons"])
    return {
        "active_courses": sum(1 for item in courses if item["status"] == "active"),
        "lessons_completed": sum(completed_counts.values()),
        "completed_courses": completed_courses,
        "courses": courses,
    }
