# EduCloud Lite Backend

FastAPI + SQLAlchemy API using Supabase PostgreSQL.

## Setup

Copy `.env.example` to `.env`. From Supabase **Connect**, use the Session Pooler URI on port `5432`, change the scheme to `postgresql+psycopg2`, URL-encode the password, and keep `sslmode=require`.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m scripts.check_database
python -m scripts.seed_dev_accounts
uvicorn main:app --reload --port 8001
```

Startup creates missing SQLAlchemy tables and applies development compatibility columns. Use Alembic migrations before production.

## Authentication and roles

- `POST /api/auth/register` always creates a student; clients cannot self-assign admin.
- `POST /api/auth/login` verifies bcrypt and returns a 12-hour JWT plus user data.
- `GET /api/auth/me` validates the bearer token and reloads the user.
- Instructor/admin ownership checks protect course, lesson, and upload mutations.
- `/api/admin/dashboard` requires admin role.
- `dev-instructor-token` is accepted only when both `APP_ENV=development` and `ENABLE_DEV_AUTH=true`; the web UI uses the signed-in JWT.

Set a long random `JWT_SECRET_KEY` and disable development auth outside local development.

## Data-backed features

- Public published courses and course detail.
- Instructor-owned course/lesson CRUD.
- Idempotent student enrollment.
- Completion and undo-completion with enrollment validation.
- Student dashboard aggregation and admin dashboard aggregation.
- Local or S3 upload abstraction. Local mode serves `backend/uploads` at `/uploads`.

## Local uploads

```dotenv
UPLOAD_STORAGE=local
LOCAL_UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://127.0.0.1:8001
```

Supported: thumbnails JPG/PNG/WebP up to 10 MB; materials PDF/DOC/DOCX/PPT/PPTX/TXT/ZIP up to 50 MB; videos MP4/WebM/MOV up to 500 MB.

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Tests use isolated SQLite data and do not modify Supabase. Current coverage includes course/lesson CRUD, authorization, uploads, enrollment, progress, and dashboard aggregation.

## Not implemented

- Email password reset.
- Formal certificates.
- Admin mutation endpoints for role/status/review operations.
- Production migrations and observability.
