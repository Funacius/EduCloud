# EduCloud Lite API Workspace

This folder contains the API contract, OpenAPI file, Postman collection, examples, and test plan. Start FastAPI on port `8001`; interactive authoritative runtime documentation is at `http://127.0.0.1:8001/docs`.

## Latest API update

The API added since the last pushed baseline (`4db8c0a`) is grouped below. Every path is relative to `/api`.

| Area | Added endpoints and behavior |
|---|---|
| Cognito auth | `POST /auth/cognito/exchange`, database-checked `POST /auth/forgot-password`, and Cognito-backed current-user sessions |
| Profile/certificates | `GET/PUT /profile`; issued certificates are returned only for the authenticated Student |
| Instructor applications | `POST /instructor-requests`, `GET /instructor-requests/me`, plus Admin list/approve/reject endpoints |
| Protected course content | `GET /courses/{id}` returns a public outline; `/courses/{id}/learning` requires enrollment and `/courses/{id}/manage` requires ownership/Admin access |
| Final assessment | Instructor `GET/PUT /instructor/courses/{id}/assessment`; Student `GET`, `start`, and `submit` assessment endpoints under `/courses/{id}/assessment` |
| Admin operations | `GET /admin/courses` for oversight and `GET /admin/health` for database, traffic, storage, service, and optional AWS metrics |

Assessment answers are scored by the backend; correct answers are never included in the Student assessment payload. Certificate issuance requires complete lesson progress plus a passing assessment attempt.

## Authentication

The browser authenticates with Cognito and calls `POST /api/auth/cognito/exchange`. The returned EduCloud token is sent as:

```text
Authorization: Bearer <JWT>
```

The browser does this automatically. The legacy `dev-instructor-token` is development-only.

## Main implemented endpoints

- Auth: Cognito token exchange, database-checked password-reset requests, and current user; legacy register/login can be disabled.
- Courses/lessons: public catalog/outline reads, protected enrolled learning content, and protected instructor/admin CRUD.
- Enrollment: enroll and retrieve the authenticated student dashboard.
- Progress: complete, undo completion, and retrieve course progress.
- Assessments: Instructor read/save final test plus Student read/start/submit timed attempts.
- Profile/certificates: `GET /api/profile` and `PUT /api/profile`; assessment-gated certificates are returned with the profile.
- Instructor access: student `POST /api/instructor-requests`, `GET /api/instructor-requests/me`, and admin list/approve/reject endpoints.
- Admin: live platform dashboard, course oversight, and health monitoring restricted to admin.
- Upload: course thumbnails, lesson materials, and videos.

## Recommended manual order

1. Login as instructor and create a draft course.
2. Add lessons, configure/publish its final assessment, then publish the course.
3. Login as student and enroll in the course.
4. Save the student's certificate profile, complete all lessons, start the timed assessment, and submit passing answers.
5. Query `/api/profile` and confirm the issued certificate; inspect instructor course counts.
6. Submit an instructor request as student, then list and approve/reject it as admin.
7. Login again after approval to exchange a new JWT containing the `instructor` role.

The checked-in Postman collection originated with the development-token flow. For JWT testing, replace its `token` variable with the value returned by the login request. Prefer Swagger when verifying newly added endpoints not yet present in the collection.
