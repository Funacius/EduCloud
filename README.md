# EduCloud Lite

EduCloud Lite is a React + FastAPI learning management system backed by Supabase PostgreSQL. It supports JWT authentication, role-based pages, course and lesson management, student enrollment and progress, local file uploads, and live student/admin dashboards.

## Implemented

- Student registration and login with bcrypt password hashes and 12-hour JWTs.
- Development student, instructor, and admin accounts stored in Supabase.
- Role guards for student, instructor, and admin pages.
- Published course catalog and course search loaded from Supabase.
- Instructor course CRUD, course settings, curriculum CRUD, thumbnails, videos, and materials.
- Student enrollment, Learning Page playlist, lesson completion, and course progress persisted in Supabase.
- Student dashboard calculated from `enrollments`, `progress`, `courses`, and `lessons`.
- Admin overview calculated from live users, roles, courses, lessons, and enrollments.
- Swagger, Postman workspace, and isolated backend tests.

AWS services are optional. Local uploads work without AWS. Password-reset email, formal certificate issuance, and advanced admin user/course actions are not implemented.

## Project status snapshot

This section is the current handoff summary for teammates and reviewers.

### Architecture

```text
React + Vite frontend (localhost:5173)
              |
              | JSON / multipart + Bearer JWT
              v
FastAPI backend (localhost:8001)
              |
              | SQLAlchemy + psycopg2, SSL
              v
Supabase hosted PostgreSQL
```

The application currently uses Supabase as hosted PostgreSQL, not Supabase Auth. FastAPI owns registration, bcrypt password verification, JWT issuance, and role authorization. Uploads use local disk during development; an S3 adapter exists but AWS configuration is outside the current completed scope.

### Database tables in active use

| Table | Purpose |
|---|---|
| `users` | Profile, email, role, and bcrypt password hash |
| `courses` | Course settings, publishing status, instructor ownership, and thumbnail URL |
| `lessons` | Ordered curriculum, notes, video URL, and material URL |
| `enrollments` | Student-to-course membership and enrollment status |
| `progress` | Per-student lesson completion state |

Development compatibility migrations add missing course detail and user auth columns on startup. This is suitable for the current prototype; production should replace it with versioned Alembic migrations.

### Behavior by role

| Role | Working behavior |
|---|---|
| Student | Register/login, browse/search published courses, enroll, watch/read lessons, open materials, complete/undo lessons, resume at the first incomplete lesson, and view database-backed progress |
| Instructor | Login, view owned courses, create/update course settings, publish/hide courses, upload thumbnails, and create/update/delete ordered lessons and resources |
| Admin | Login and inspect live aggregate counts/recent users from Supabase; the page is intentionally read-only |

### Data integrity rules currently enforced

- Public registration always creates `student`; a client cannot register itself as admin.
- Course/lesson/upload mutations require instructor or admin authorization and ownership checks.
- Only published courses appear in the public catalog.
- Enrollment is idempotent for normal application requests.
- A student must enroll before the API accepts lesson progress.
- Student and admin dashboards calculate values from database rows; they contain no fixed demo metrics.
- The frontend automatically attaches the signed-in JWT to API requests.

### Remaining non-AWS limitations

- Password reset has no email/reset-token implementation and is labelled unavailable in the UI.
- Course completion is calculated, but there is no certificate table or downloadable certificate.
- Admin has no role editing, account suspension, deletion, or course-review actions.
- Schema evolution still uses a development compatibility helper instead of Alembic.
- The checked-in Postman collection began with the legacy development-token flow; replace its token variable with a login JWT when testing protected endpoints.

## Run locally with Supabase

Prerequisites: Python 3.11+, Node.js 18+, and a Supabase project.

1. Copy `backend/.env.example` to `backend/.env` and set the Supabase Session Pooler URI:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@POOLER_HOST:5432/postgres?sslmode=require
APP_ENV=development
ENABLE_DEV_AUTH=true
JWT_SECRET_KEY=replace-with-a-long-random-value
```

2. Install, verify, migrate, and seed the backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m scripts.check_database
python -m scripts.seed_dev_accounts
uvicorn main:app --reload --port 8001
```

3. Start the frontend in a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. API health and Swagger are available at `http://127.0.0.1:8001` and `http://127.0.0.1:8001/docs`.

## Development accounts

Run `python -m scripts.seed_dev_accounts` before using these accounts. The shared development password is `Demo123!`.

| Role | Email |
|---|---|
| Student | `student@educloud.local` |
| Instructor | `instructor@educloud.local` |
| Admin | `admin@educloud.local` |

These are development-only accounts. The seed command updates their password hashes each time it runs.

## Frontend UI verification

### Instructor

1. Sign in as the instructor and open **Instructor**.
2. Create a course, complete its settings, and save it as `Published`.
3. Open **Edit**, add at least two lessons, and optionally upload a video/material.
4. Confirm the course appears in the public catalog and in Supabase `courses`/`lessons`.

### Student

1. Sign out, then sign in as the student.
2. Open **Courses**, select the published course, and click **Start Course**.
3. Confirm a row appears in Supabase `enrollments`.
4. Open lessons and click **Mark as complete**; refresh the page and verify completion remains.
5. Confirm rows appear in `progress` and **My Learning** shows the same counts and percentages.

### Admin

1. Sign out, then sign in as admin.
2. Confirm total users and role counts match Supabase `users`.
3. Confirm published/draft courses, lessons, and enrollments match their tables.
4. Verify a student account cannot open `/admin` or call `/api/admin/dashboard`.

## Verification commands

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q

cd ..\frontend
npm run build
```

See `backend/README.md`, `frontend/README.md`, and `api/README.md` for component-specific details.
