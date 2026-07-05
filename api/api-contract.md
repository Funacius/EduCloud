# EduCloud Lite API Contract

## Endpoint Ownership

API Developer - Course & Lesson owns:
- Course API
- Lesson API
- Course and lesson sections in `openapi.yaml`

API Developer - Enrollment, Upload & Testing owns:
- Enrollment API
- Progress API
- Upload API
- Postman testing
- CloudWatch log checking

## Required Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Course

- `GET /api/courses`
- `GET /api/courses/{course_id}`
- `POST /api/courses`
- `PUT /api/courses/{course_id}`
- `DELETE /api/courses/{course_id}`

### Lesson

- `GET /api/courses/{course_id}/lessons`
- `POST /api/courses/{course_id}/lessons`
- `PUT /api/lessons/{lesson_id}`
- `DELETE /api/lessons/{lesson_id}`

### Enrollment

- `POST /api/courses/{course_id}/enroll`
- `GET /api/my-courses`

### Progress

- `POST /api/lessons/{lesson_id}/complete`
- `GET /api/courses/{course_id}/progress`

### Upload

- `POST /api/upload/course-thumbnail`
- `POST /api/upload/lesson-material`
- `POST /api/upload/video`

## Standard Response Format

Success:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```
