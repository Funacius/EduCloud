# EduCloud Lite API Contract

Course/Lesson JSON uses `camelCase`. Public resource IDs are strings such as
`course-1` and `lesson-1`; database integer IDs are internal only.

## Endpoint Ownership

API Developer - Course & Lesson owns:

- Course API.
- Lesson API.
- Course/Lesson sections in `openapi.yaml`.


## Standard Response Format

Success:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {}
}
```

Domain error:

```json
{
  "success": false,
  "message": "Course not found",
  "error": "COURSE_NOT_FOUND"
}
```

## Required Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Course

| Method | Path | Access | Response data |
| --- | --- | --- | --- |
| `GET` | `/api/courses?q=cloud` | Public | `Course[]` |
| `GET` | `/api/courses/{course_id}` | Public | `CourseDetail` |
| `POST` | `/api/courses` | Instructor/Admin | `Course` |
| `PUT` | `/api/courses/{course_id}` | Owner Instructor/Admin | `Course` |
| `DELETE` | `/api/courses/{course_id}` | Owner Instructor/Admin | `{ id, archived }` |

`{course_id}` is a public ID such as `course-1`, not the internal database
integer. `GET /api/courses` returns a direct array in `data`; it does not return
pagination metadata.

### Course list item

```json
{
  "id": "course-1",
  "title": "Cloud Fundamentals",
  "description": "Learn the basic concepts of cloud computing.",
  "instructorName": "EduCloud Lite Team",
  "thumbnailUrl": "https://example.com/course.jpg",
  "level": "Beginner",
  "category": "Foundations",
  "tags": ["Cloud", "AWS"],
  "duration": "4 lessons"
}
```

Required `Course` response fields are `id`, `title`, `description`, and
`instructorName`. The remaining fields are optional in a list item.

### Course detail

`CourseDetail` contains all `Course` fields and the fields used by the current
`CourseDetailPage`:

```json
{
  "videoCount": "4 video lessons",
  "whatYouWillLearn": ["Understand cloud computing"],
  "lessons": ["Introduction to Cloud Computing"],
  "requirements": ["Basic web development knowledge"]
}
```

`lessons` is `string[]` in Course detail because the current frontend only
renders lesson titles. Full Lesson objects are returned by the Learning API.

### Course create/update request

```json
{
  "title": "Cloud Fundamentals",
  "description": "Learn the basic concepts of cloud computing.",
  "thumbnailUrl": "https://example.com/course.jpg",
  "level": "Beginner",
  "category": "Foundations",
  "tags": ["Cloud", "AWS"],
  "whatYouWillLearn": ["Understand cloud computing"],
  "requirements": ["Basic web development knowledge"]
}
```

Course create requires `title` and `description`. Course update is partial and
must contain at least one field. The client cannot set `id`, instructor fields,
status, `duration`, or `videoCount`.

Course create uses the authenticated actor as instructor and defaults to
`published`. Course status is internal and is not returned in the public
`Course` type.

### Course archive response

`DELETE /api/courses/{course_id}` is a soft archive operation:

```json
{
  "success": true,
  "message": "Course archived",
  "data": {
    "id": "course-1",
    "archived": true
  }
}
```

It does not physically delete the course, lessons, enrollments, or progress
history. Archived courses are hidden from public list/detail endpoints.

### Lesson

| Method | Path | Access | Response data |
| --- | --- | --- | --- |
| `GET` | `/api/courses/{course_id}/lessons` | Public in MVP | `Lesson[]` |
| `POST` | `/api/courses/{course_id}/lessons` | Owner Instructor/Admin | `Lesson` |
| `PUT` | `/api/lessons/{lesson_id}` | Owner Instructor/Admin | `Lesson` |
| `DELETE` | `/api/lessons/{lesson_id}` | Owner Instructor/Admin | `{ id, archived }` |

`{course_id}` is `course-1`; `{lesson_id}` is `lesson-1`.

```json
{
  "id": "lesson-1",
  "courseId": "course-1",
  "title": "Introduction to AWS",
  "content": "Lesson content",
  "videoUrl": "https://example.com/video.mp4",
  "materialUrl": "https://example.com/material.pdf",
  "order": 1
}
```

Lesson create/update request:

```json
{
  "title": "Introduction to AWS",
  "content": "Lesson content",
  "videoUrl": "https://example.com/video.mp4",
  "materialUrl": "https://example.com/material.pdf",
  "order": 1
}
```

`order` must be a positive integer and unique among active lessons in the same
course. Lesson lists are sorted by `order ASC`, then internal ID `ASC`.

`DELETE /api/lessons/{lesson_id}` archives the lesson instead of physically
deleting it. Archived lessons are hidden from Course detail and Learning list,
while progress history is preserved.

## Access Rules

| Actor | Read Course | Read Lesson | Course mutation | Lesson mutation |
| --- | --- | --- | --- | --- |
| Anonymous | Yes | Yes in MVP | No | No |
| Student | Yes | Yes in MVP | No | No |
| Instructor | Yes | Yes | Own courses only | Lessons in own courses only |
| Admin | Yes | Yes | All courses | All lessons |

Lesson read is public in the MVP because the current frontend Start Course flow
goes directly to `/learn/:courseId` without a Bearer token or enrollment check.
Enrollment-based access can be added later through authorization dependencies
without changing the Lesson DTO.

## ID and Naming Conversion

| Layer | ID convention | Field convention |
| --- | --- | --- |
| Database/SQLAlchemy | Integer | `snake_case` |
| Python service | Integer | `snake_case` |
| HTTP JSON/TypeScript | Public string | `camelCase` |

Examples:

```text
course-1  ↔  course_id = 1
lesson-5  ↔  lesson_id = 5
thumbnailUrl  ↔  thumbnail_url
courseId      ↔  course_id
videoUrl      ↔  video_url
materialUrl   ↔  material_url
order         ↔  order_index
```

The route parses the public ID before calling the service. The response schema
serializes the internal integer back to a public ID and applies JSON aliases.
Aliases rename keys; they do not convert integer ID values.

Invalid examples include `abc`, `course-0`, `course--1`, `lesson-1` at a Course
endpoint, and `course-1` at a Lesson endpoint.

## Derived Fields

- `instructorName` comes from the Course → User relationship, not the request.
- `duration` is the number of active lessons formatted as `"{n} lessons"`.
- `videoCount` is the number of active lessons with a video formatted as
  `"{n} video lessons"`.
- Course detail `lessons` contains active lesson titles ordered by `order`, then
  internal ID.
- `whatYouWillLearn` and `requirements` are Course string arrays.

## Error Codes

| Case | HTTP | Error code |
| --- | ---: | --- |
| Invalid public ID format/prefix | 400 | `INVALID_PUBLIC_ID` |
| Empty update payload | 400 | `VALIDATION_ERROR` |
| Missing authentication on mutation | 401 | `AUTHENTICATION_REQUIRED` |
| Course role/ownership failure | 403 | `COURSE_FORBIDDEN` |
| Lesson role/ownership failure | 403 | `LESSON_FORBIDDEN` |
| Course missing, draft, or archived | 404 | `COURSE_NOT_FOUND` |
| Lesson missing or archived | 404 | `LESSON_NOT_FOUND` |
| Duplicate active lesson order | 409 | `LESSON_ORDER_CONFLICT` |
| Invalid request body/path/query | 422 | `VALIDATION_ERROR` |

Example error:

```json
{
  "success": false,
  "message": "Lesson order already exists in this course",
  "error": "LESSON_ORDER_CONFLICT"
}
```

## Frontend Integration Flow

```text
CourseListPage
→ GET /api/courses
→ ApiResponse<Course[]>

CourseDetailPage
→ GET /api/courses/course-1
→ ApiResponse<CourseDetail>

Start Course
→ /learn/course-1
→ GET /api/courses/course-1/lessons
→ ApiResponse<Lesson[]>
```

## Other API Areas

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
