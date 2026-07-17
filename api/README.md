# EduCloud Lite API Workspace

This folder contains the API contract, OpenAPI file, Postman collection, examples, and test plan. Start FastAPI on port `8001`; interactive authoritative runtime documentation is at `http://127.0.0.1:8001/docs`.

## Authentication

Call `POST /api/auth/login`, copy `data.token`, and send it as:

```text
Authorization: Bearer <JWT>
```

The browser does this automatically. The legacy `dev-instructor-token` is development-only.

## Main implemented endpoints

- Auth: register, login, current user.
- Courses/lessons: public reads and protected instructor/admin CRUD.
- Enrollment: enroll and retrieve the authenticated student dashboard.
- Progress: complete, undo completion, and retrieve course progress.
- Admin: live platform dashboard restricted to admin.
- Upload: course thumbnails, lesson materials, and videos.

## Recommended manual order

1. Login as instructor and create/publish a course.
2. Add lessons and upload optional resources.
3. Login as student and enroll in the course.
4. Complete a lesson and query course progress/my courses.
5. Login as admin and query `/api/admin/dashboard`.

The checked-in Postman collection originated with the development-token flow. For JWT testing, replace its `token` variable with the value returned by the login request. Prefer Swagger when verifying newly added endpoints not yet present in the collection.
