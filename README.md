# EduCloud Lite - Cloud-Based Learning Management Platform on AWS

EduCloud Lite is a lightweight Udemy-style learning management platform designed for AWS deployment. Students can register, log in, browse courses, enroll, view lessons, access learning materials, and track progress. Instructors can create courses and lessons.

This repository is currently a clean skeleton only. Production logic, real AWS integration, authentication security, and database implementation will be added later.

## Team Role Assignment

1. Leader / Frontend Developer
- Works in `frontend/`
- Builds UI pages
- Connects frontend to API
- Manages demo flow and documentation

2. Backend Core Developer
- Works in `backend/app/routes/auth_routes.py`
- Works in `backend/app/services/auth_service.py`
- Works in `backend/app/models/user.py`
- Works in `backend/app/middleware/auth_middleware.py`
- Handles authentication, JWT, role, user management, database connection

3. Backend Business Logic Developer
- Works in `backend/app/models/`
- Works in `backend/app/services/`
- Handles course, lesson, enrollment, progress business logic

4. API Developer - Course & Lesson
- Works in `backend/app/routes/course_routes.py`
- Works in `backend/app/routes/lesson_routes.py`
- Works in `api/api-contract.md`
- Works in `api/openapi.yaml`
- Handles course and lesson endpoints

5. API Developer - Enrollment, Upload & Testing
- Works in `backend/app/routes/enrollment_routes.py`
- Works in `backend/app/routes/progress_routes.py`
- Works in `backend/app/routes/upload_routes.py`
- Works in `backend/app/services/s3_service.py`
- Works in `api/postman/`
- Works in `api/test-plan/`
- Handles enrollment, progress, upload, API testing, and CloudWatch log checking

## Folder Structure

```text
EduCloud/
├── frontend/
├── backend/
└── api/
```

## How Each Member Should Work

- Keep changes inside your assigned folder or files.
- Add simple TODO notes before adding full logic.
- Avoid committing real AWS credentials or local `.env` files.
- Use `.env.example` as the template for environment variables.
- Coordinate API changes through `api/api-contract.md` and `api/openapi.yaml`.

## Basic Setup Guide

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs and tests:
```bash
cd api
```

Import `api/postman/EduCloud.postman_collection.json` into Postman when ready.

## Git Branch Suggestion

- `main`
- `develop`
- `feature/frontend`
- `feature/backend-auth`
- `feature/backend-logic`
- `feature/api-course-lesson`
- `feature/api-enrollment-upload-testing`
