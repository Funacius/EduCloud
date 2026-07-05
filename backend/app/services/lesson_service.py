def list_lessons(course_id: int) -> list[dict]:
    # TODO Backend Business Logic Developer: Query lessons by course.
    return []


def create_lesson(course_id: int, payload: dict) -> dict:
    # TODO Backend Business Logic Developer: Save lesson for course.
    return {"course_id": course_id, **payload}


def update_lesson(lesson_id: int, payload: dict) -> dict:
    # TODO Backend Business Logic Developer: Update lesson fields.
    return {"id": lesson_id, **payload}


def delete_lesson(lesson_id: int) -> dict:
    # TODO Backend Business Logic Developer: Delete lesson and related progress safely.
    return {"id": lesson_id}
