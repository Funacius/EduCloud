from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.assessment_schema import AssessmentAnswer, AssessmentSubmit, AssessmentUpsert
from app.schemas.profile_schema import StudentProfileUpdate
from app.services import assessment_service, course_service, enrollment_service, profile_service, progress_service


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

        instructor_token = {"user_id": instructor.id, "role": "instructor"}
        student_token = {"user_id": student.id, "role": "student"}
        assessment_service.save_instructor_assessment(db, course.id, AssessmentUpsert(
            title="Final test",
            time_limit_minutes=10,
            passing_score=70,
            max_attempts=2,
            is_published=True,
            questions=[{
                "prompt": "Choose the correct answer",
                "options": ["Correct", "Incorrect"],
                "correct_option_index": 0,
                "order_index": 0,
            }],
        ), instructor_token)

        enrollment_service.enroll_course(db, course.id, student_token)
        progress_service.set_lesson_completed(db, lessons[0].id, student_token, True)

        progress = progress_service.get_course_progress(db, course.id, student_token)
        dashboard = enrollment_service.get_student_dashboard(db, student.id, "student")
        assert progress["percentage"] == 50
        assert progress["completed_lesson_ids"] == [lessons[0].id]
        assert dashboard["active_courses"] == 1
        assert dashboard["lessons_completed"] == 1
        assert dashboard["completed_courses"] == 0
        assert dashboard["courses"][0]["percentage"] == 50

        profile_service.update_profile(db, StudentProfileUpdate(
            certificate_name="Student Certificate Name",
            organization="EduCloud Academy",
            country="Vietnam",
        ), {"user_id": student.id, "role": "student"})
        completion = progress_service.set_lesson_completed(db, lessons[1].id, student_token, True)
        assert completion["certificate_issued"] is False
        started = assessment_service.start_student_assessment(db, course.id, student_token)
        result = assessment_service.submit_student_assessment(db, course.id, AssessmentSubmit(
            attempt_id=started["attempt_id"],
            answers=[AssessmentAnswer(question_id=assessment_service.get_student_assessment(db, course.id, student_token)["questions"][0].id, selected_option_index=0)],
        ), student_token)
        certificate = db.query(Certificate).filter_by(user_id=student.id, course_id=course.id).one()
        profile = db.query(StudentProfile).filter_by(user_id=student.id).one()
        enrollment = db.query(Enrollment).filter_by(user_id=student.id, course_id=course.id).one()
        summaries = course_service.list_instructor_course_summaries(db, {"user_id": instructor.id, "role": "instructor"})

        assert result["certificate_issued"] is True
        assert result["passed"] is True
        assert certificate.recipient_name == "Student Certificate Name"
        assert certificate.profile_id == profile.id
        assert enrollment.status == "completed"
        assert summaries[0]["enrolled_students"] == 1
        assert summaries[0]["completed_students"] == 1
    finally:
        db.close()
