"""SQLAlchemy model registry.

Importing every model here ensures they are registered on ``Base.metadata``
(needed for ``Base.metadata.create_all`` and for relationship name lookups
such as Course.lessons <-> Lesson.course) before the app starts.
"""

from app.models.course import Course
from app.models.assessment import AssessmentAttempt, AssessmentQuestion, CourseAssessment
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.instructor_request import InstructorRequest
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.student_profile import StudentProfile
from app.models.user import User

__all__ = [
    "User", "Course", "Lesson", "Enrollment", "Progress", "StudentProfile", "Certificate",
    "InstructorRequest", "CourseAssessment", "AssessmentQuestion", "AssessmentAttempt",
]
