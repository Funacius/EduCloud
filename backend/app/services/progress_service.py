def complete_lesson(lesson_id: int) -> dict:
    # TODO API Developer - Enrollment, Upload & Testing: Mark lesson complete for current user.
    return {"lesson_id": lesson_id, "is_completed": True}


def get_course_progress(course_id: int) -> dict:
    # TODO API Developer - Enrollment, Upload & Testing: Calculate progress percentage.
    return {"course_id": course_id, "completed_lessons": 0, "total_lessons": 0, "percentage": 0}
