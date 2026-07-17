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

Register creates a `student`. Login returns `data.token` (JWT) and `data.user`.

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

Both endpoints require a student JWT. `GET /api/my-courses` returns dashboard totals and enrolled-course progress derived from database rows.

### Progress

- `POST /api/lessons/{lesson_id}/complete`
- `DELETE /api/lessons/{lesson_id}/complete`
- `GET /api/courses/{course_id}/progress`

Progress mutations require an enrollment in the lesson's course.

### Admin

- `GET /api/admin/dashboard`

Requires an admin JWT and returns live user, role, course, lesson, and enrollment metrics.

### Upload

- `POST /api/upload/course-thumbnail`
- `POST /api/upload/lesson-material`
- `POST /api/upload/video`

## Course & Lesson Notes

- `POST /api/courses` requires the caller's role to be `instructor` or `admin` (send `Authorization: Bearer <token>`).
- `PUT/DELETE /api/courses/{course_id}` and `PUT/DELETE /api/lessons/{lesson_id}` require the caller to be the course's `instructor_id` or an `admin`.
- Course fields: `title`, `description`, `thumbnail_url`, `price`, `status` (`draft` | `published` | `archived`), `instructor_id`, `created_at`, `updated_at`.
- `GET /api/courses/{course_id}` returns the course plus its `lessons`, ordered by `order_index`.
- Lesson fields: `title`, `content`, `video_url`, `material_url`, `order_index`, `course_id`.
- Full request/response shapes are defined in `openapi.yaml` (`Course`, `CourseDetail`, `Lesson`, and their `*Create`/`*Update` variants).

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
