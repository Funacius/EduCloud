from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AssessmentQuestionWrite(BaseModel):
    id: int | None = None
    prompt: str = Field(min_length=3, max_length=1000)
    options: list[str] = Field(min_length=2, max_length=6)
    correct_option_index: int = Field(ge=0)
    explanation: str | None = Field(default=None, max_length=2000)
    order_index: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_options(self):
        cleaned = [option.strip() for option in self.options]
        if any(not option for option in cleaned):
            raise ValueError("Question options cannot be empty")
        if self.correct_option_index >= len(cleaned):
            raise ValueError("Correct option index is outside the options list")
        self.options = cleaned
        return self


class AssessmentUpsert(BaseModel):
    title: str = Field(default="Final assessment", min_length=3, max_length=200)
    instructions: str | None = Field(default=None, max_length=4000)
    time_limit_minutes: int = Field(default=20, ge=1, le=180)
    passing_score: int = Field(default=70, ge=1, le=100)
    max_attempts: int = Field(default=3, ge=1, le=10)
    is_published: bool = False
    questions: list[AssessmentQuestionWrite] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_publishable(self):
        if self.is_published and not self.questions:
            raise ValueError("Add at least one question before publishing the assessment")
        return self


class AssessmentQuestionInstructorRead(AssessmentQuestionWrite):
    model_config = ConfigDict(from_attributes=True)
    id: int


class AssessmentInstructorRead(BaseModel):
    id: int | None
    course_id: int
    title: str
    instructions: str | None
    time_limit_minutes: int
    passing_score: int
    max_attempts: int
    is_published: bool
    questions: list[AssessmentQuestionInstructorRead]


class AssessmentQuestionStudentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    prompt: str
    options: list[str]
    order_index: int


class AssessmentStudentRead(BaseModel):
    id: int
    course_id: int
    course_title: str
    title: str
    instructions: str | None
    time_limit_minutes: int
    passing_score: int
    max_attempts: int
    attempts_used: int
    lessons_completed: int
    total_lessons: int
    eligible: bool
    passed: bool
    active_attempt_id: int | None
    expires_at: datetime | None
    questions: list[AssessmentQuestionStudentRead]


class AssessmentStartRead(BaseModel):
    attempt_id: int
    attempt_number: int
    expires_at: datetime


class AssessmentAnswer(BaseModel):
    question_id: int
    selected_option_index: int = Field(ge=0)


class AssessmentSubmit(BaseModel):
    attempt_id: int
    answers: list[AssessmentAnswer]


class AssessmentSubmitRead(BaseModel):
    attempt_id: int
    score: int
    passed: bool
    passing_score: int
    correct_answers: int
    total_questions: int
    certificate_issued: bool
