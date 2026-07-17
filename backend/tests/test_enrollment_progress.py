from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.user import User
from app.services import enrollment_service, progress_service


def test_enrollment_progress_and_dashboard_use_database_rows():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    try:
        instructor = User(id=1, full_name="Instructor", email="teacher@example.com", role="instructor")
        student = User(id=2, full_name="Student", email="student@example.com", role="student")
        db.add_all([instructor, student])
        db.flush()
        course = Course(title="Database course", status="published", instructor_id=instructor.id)
        db.add(course)
        db.flush()
        lessons = [Lesson(course_id=course.id, title="One", order_index=1), Lesson(course_id=course.id, title="Two", order_index=2)]
        db.add_all(lessons)
        db.commit()

        enrollment_service.enroll_course(db, course.id, student.id)
        progress_service.set_lesson_completed(db, lessons[0].id, student.id, True)

        progress = progress_service.get_course_progress(db, course.id, student.id)
        dashboard = enrollment_service.get_student_dashboard(db, student.id)
        assert progress["percentage"] == 50
        assert progress["completed_lesson_ids"] == [lessons[0].id]
        assert dashboard["active_courses"] == 1
        assert dashboard["lessons_completed"] == 1
        assert dashboard["completed_courses"] == 0
        assert dashboard["courses"][0]["percentage"] == 50
    finally:
        db.close()
