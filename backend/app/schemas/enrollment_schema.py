from pydantic import BaseModel


class EnrollmentRead(BaseModel):
    # TODO API Developer - Enrollment, Upload & Testing: Align response with frontend needs.
    id: int
    user_id: int
    course_id: int
    status: str
