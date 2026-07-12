from pydantic import BaseModel


class ProgressRead(BaseModel):
    # TODO API Developer - Enrollment, Upload & Testing: Add percentage and completed lesson count.
    course_id: int
    completed_lessons: int
    total_lessons: int
    percentage: float
