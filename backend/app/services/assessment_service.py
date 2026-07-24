from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.assessment import AssessmentAttempt, AssessmentQuestion, CourseAssessment
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.schemas.assessment_schema import AssessmentSubmit, AssessmentUpsert
from app.services.certificate_service import issue_if_course_completed
from app.utils.authorization import require_course_owner_or_admin


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _assessment_with_questions(db: Session, course_id: int) -> CourseAssessment | None:
    return (
        db.query(CourseAssessment)
        .options(joinedload(CourseAssessment.questions))
        .filter(CourseAssessment.course_id == course_id)
        .first()
    )


def _require_student(current_user: dict) -> int:
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    return int(current_user["user_id"])


def _require_enrollment(db: Session, course_id: int, user_id: int) -> Enrollment:
    enrollment = db.query(Enrollment).filter_by(course_id=course_id, user_id=user_id).first()
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enroll in this course before taking its assessment")
    return enrollment


def _lesson_counts(db: Session, course_id: int, user_id: int) -> tuple[int, int]:
    total = db.query(func.count(Lesson.id)).filter(Lesson.course_id == course_id).scalar() or 0
    completed = db.query(func.count(Progress.id)).filter(
        Progress.course_id == course_id,
        Progress.user_id == user_id,
        Progress.is_completed.is_(True),
    ).scalar() or 0
    return int(total), int(completed)


def _expires_at(assessment: CourseAssessment, attempt: AssessmentAttempt) -> datetime:
    return _as_utc(attempt.started_at) + timedelta(minutes=assessment.time_limit_minutes)


def _is_correct_answer(question: AssessmentQuestion, selected_indices: list[int]) -> bool:
    selected = set(selected_indices)
    correct = set(question.normalized_correct_option_indices)
    if question.answer_mode == "any":
        return len(selected) == 1 and bool(selected & correct)
    return selected == correct


def _finalize_expired_attempts(db: Session, assessment: CourseAssessment, user_id: int) -> None:
    changed = False
    for attempt in db.query(AssessmentAttempt).filter_by(
        assessment_id=assessment.id,
        user_id=user_id,
        submitted_at=None,
    ).all():
        if _utc_now() > _expires_at(assessment, attempt) + timedelta(seconds=5):
            attempt.answers = attempt.answers or {}
            attempt.score = 0
            attempt.passed = False
            attempt.submitted_at = _utc_now()
            changed = True
    if changed:
        db.commit()


def get_instructor_assessment(db: Session, course_id: int, current_user: dict) -> dict:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    require_course_owner_or_admin(course, current_user)
    assessment = _assessment_with_questions(db, course_id)
    if assessment is None:
        return {
            "id": None,
            "course_id": course_id,
            "title": "Final assessment",
            "instructions": "Answer every question and submit before the timer expires.",
            "time_limit_minutes": 20,
            "passing_score": 70,
            "max_attempts": 3,
            "is_published": False,
            "questions": [],
        }
    return {
        "id": assessment.id,
        "course_id": course_id,
        "title": assessment.title,
        "instructions": assessment.instructions,
        "time_limit_minutes": assessment.time_limit_minutes,
        "passing_score": assessment.passing_score,
        "max_attempts": assessment.max_attempts,
        "is_published": assessment.is_published,
        "questions": assessment.questions,
    }


def save_instructor_assessment(db: Session, course_id: int, payload: AssessmentUpsert, current_user: dict) -> dict:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    require_course_owner_or_admin(course, current_user)
    assessment = _assessment_with_questions(db, course_id)
    if assessment is None:
        assessment = CourseAssessment(course_id=course_id)
        db.add(assessment)
        db.flush()
    active_attempt = db.query(AssessmentAttempt.id).filter_by(assessment_id=assessment.id, submitted_at=None).first()
    if active_attempt:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wait for active student attempts to finish before editing the assessment",
        )

    assessment.title = payload.title.strip()
    assessment.instructions = payload.instructions.strip() if payload.instructions else None
    assessment.time_limit_minutes = payload.time_limit_minutes
    assessment.passing_score = payload.passing_score
    assessment.max_attempts = payload.max_attempts
    assessment.is_published = payload.is_published
    assessment.questions.clear()
    db.flush()
    for index, question in enumerate(payload.questions):
        assessment.questions.append(AssessmentQuestion(
            prompt=question.prompt.strip(),
            options=question.options,
            correct_option_index=question.correct_option_index,
            correct_option_indices=question.correct_option_indices,
            answer_mode=question.answer_mode,
            explanation=question.explanation.strip() if question.explanation else None,
            order_index=question.order_index if question.order_index is not None else index,
        ))
    db.commit()
    return get_instructor_assessment(db, course_id, current_user)


def get_student_assessment(db: Session, course_id: int, current_user: dict) -> dict:
    user_id = _require_student(current_user)
    _require_enrollment(db, course_id, user_id)
    course = db.get(Course, course_id)
    assessment = _assessment_with_questions(db, course_id)
    if course is None or assessment is None or not assessment.is_published or not assessment.questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The final assessment is not available yet")
    _finalize_expired_attempts(db, assessment, user_id)
    attempts = db.query(AssessmentAttempt).filter_by(assessment_id=assessment.id, user_id=user_id).order_by(AssessmentAttempt.attempt_number).all()
    active = next((attempt for attempt in attempts if attempt.submitted_at is None), None)
    total, completed = _lesson_counts(db, course_id, user_id)
    return {
        "id": assessment.id,
        "course_id": course_id,
        "course_title": course.title,
        "title": assessment.title,
        "instructions": assessment.instructions,
        "time_limit_minutes": assessment.time_limit_minutes,
        "passing_score": assessment.passing_score,
        "max_attempts": assessment.max_attempts,
        "attempts_used": len(attempts),
        "lessons_completed": completed,
        "total_lessons": total,
        "eligible": total > 0 and completed >= total,
        "passed": any(attempt.passed is True for attempt in attempts),
        "active_attempt_id": active.id if active else None,
        "expires_at": _expires_at(assessment, active) if active else None,
        "questions": assessment.questions,
    }


def start_student_assessment(db: Session, course_id: int, current_user: dict) -> dict:
    state = get_student_assessment(db, course_id, current_user)
    user_id = int(current_user["user_id"])
    if not state["eligible"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Complete every lesson before starting the final assessment")
    if state["passed"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already passed this assessment")
    assessment = _assessment_with_questions(db, course_id)
    assert assessment is not None
    if state["active_attempt_id"]:
        attempt = db.get(AssessmentAttempt, state["active_attempt_id"])
        assert attempt is not None
        return {
            "attempt_id": attempt.id,
            "attempt_number": attempt.attempt_number,
            "expires_at": _expires_at(assessment, attempt),
        }
    if state["attempts_used"] >= assessment.max_attempts:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No assessment attempts remain")
    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=user_id,
        attempt_number=state["attempts_used"] + 1,
        answers={},
        started_at=_utc_now(),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {
        "attempt_id": attempt.id,
        "attempt_number": attempt.attempt_number,
        "expires_at": _expires_at(assessment, attempt),
    }


def submit_student_assessment(db: Session, course_id: int, payload: AssessmentSubmit, current_user: dict) -> dict:
    user_id = _require_student(current_user)
    _require_enrollment(db, course_id, user_id)
    assessment = _assessment_with_questions(db, course_id)
    if assessment is None or not assessment.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The final assessment is not available")
    attempt = db.get(AssessmentAttempt, payload.attempt_id)
    if attempt is None or attempt.assessment_id != assessment.id or attempt.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment attempt not found")
    if attempt.submitted_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This assessment attempt has already been submitted")

    submitted_answers = {answer.question_id: answer.selected_option_indices for answer in payload.answers}
    questions_by_id = {question.id: question for question in assessment.questions}
    for question_id, selected_indices in submitted_answers.items():
        question = questions_by_id.get(question_id)
        if question is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="An answer references an unknown question")
        if any(index >= len(question.options) for index in selected_indices):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="An answer references an unknown option")

    expired = _utc_now() > _expires_at(assessment, attempt) + timedelta(seconds=5)
    correct = 0 if expired else sum(
        1 for question in assessment.questions
        if _is_correct_answer(question, submitted_answers.get(question.id, []))
    )
    total = len(assessment.questions)
    score = round(correct * 100 / total) if total else 0
    passed = not expired and score >= assessment.passing_score
    attempt.answers = {str(key): value for key, value in submitted_answers.items()}
    attempt.score = score
    attempt.passed = passed
    attempt.submitted_at = _utc_now()
    db.flush()
    certificate = issue_if_course_completed(db, user_id, course_id) if passed else None
    db.commit()
    return {
        "attempt_id": attempt.id,
        "score": score,
        "passed": passed,
        "passing_score": assessment.passing_score,
        "correct_answers": correct,
        "total_questions": total,
        "certificate_issued": bool(certificate),
    }
