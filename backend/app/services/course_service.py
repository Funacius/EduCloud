def list_courses() -> list[dict]:
    # TODO Backend Business Logic Developer: Query courses with instructor information.
    return []


def get_course(course_id: int) -> dict:
    # TODO Backend Business Logic Developer: Return course detail and lesson summary.
    return {"id": course_id}


def create_course(payload: dict) -> dict:
    # TODO Backend Business Logic Developer: Validate instructor role and save course.
    return payload


def update_course(course_id: int, payload: dict) -> dict:
    # TODO Backend Business Logic Developer: Update course fields.
    return {"id": course_id, **payload}


def delete_course(course_id: int) -> dict:
    # TODO Backend Business Logic Developer: Delete or archive course.
    return {"id": course_id}
