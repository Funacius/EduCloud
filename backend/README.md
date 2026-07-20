# EduCloud Lite Backend

FastAPI + SQLAlchemy API using Supabase PostgreSQL.

## Latest backend update

Compared with the last pushed baseline (`4db8c0a`), the backend now includes:

- Cognito ID-token verification/exchange, database-checked forgot-password requests, and persisted `cognito_sub` identity mapping.
- Student profile, certificate, Instructor application, final-assessment question/configuration, and assessment-attempt models.
- Server-side assessment scoring, deadlines, attempt limits, course-completion checks, and idempotent certificate issuance.
- Separate public outline, enrolled-learning, and Instructor/Admin management course responses so private lesson content is not exposed by public endpoints.
- Student-only enrollment/progress validation, Instructor ownership enforcement, publish prerequisites, and unique enrollment/progress indexes.
- Live Student, Instructor, and Admin aggregate data plus Admin course oversight and health-monitoring APIs.
- Basic security headers and per-IP rate limiting for sensitive authentication routes.
- Twelve isolated backend tests covering authentication, role workflows, protected content, assessments, certificates, monitoring, and existing course behavior.

The new SQLAlchemy tables are created when the backend restarts. Existing published courses must receive a published final assessment before new Students can enroll and before enrolled Students can earn certificates.

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

- Cognito owns signup, email confirmation, login credentials, and password recovery.
- `POST /api/auth/cognito/exchange` verifies a Cognito ID token and maps the confirmed identity to Supabase by `cognito_sub` or verified email.
- `POST /api/auth/forgot-password` checks for a linked Supabase/Cognito identity before requesting a Cognito reset code and never reveals whether the email exists.
- New Cognito identities always receive local role `student`; Instructor promotion still requires Admin approval.
- Legacy `POST /api/auth/register` and `/login` exist only for migration and are controlled by `ALLOW_LEGACY_AUTH`; set it to `false` in production.
- `GET /api/auth/me` validates the bearer token and reloads the user.
- Instructor/admin ownership checks protect course, lesson, and upload mutations.
- Public course responses expose lesson outlines only; full learning content requires an enrolled Student or course owner/Admin.
- Sensitive auth endpoints have a lightweight per-IP in-memory rate limit and all API responses receive basic security headers.
- `/api/admin/dashboard` requires admin role.
- `dev-instructor-token` is accepted only when both `APP_ENV=development` and `ENABLE_DEV_AUTH=true`; the web UI uses the signed-in JWT.

Set a long random `JWT_SECRET_KEY`, `ALLOW_LEGACY_AUTH=false`, and disable development auth outside local development.

## Data-backed features

- Public published courses and course detail.
- Instructor-owned course/lesson CRUD.
- Idempotent student enrollment.
- Completion and undo-completion with Student-role and enrollment validation.
- Timed final-assessment configuration, questions, attempts, scoring, backend deadline enforcement, and attempt limits.
- Student certificate profile read/update at `GET/PUT /api/profile`.
- Automatic one-per-student/course certificate issuance only after lesson completion and a passing final assessment.
- Instructor course summaries with enrolled and completed student counts.
- Instructor access requests with rejection/resubmission and admin approval that promotes `users.role`.
- Student dashboard aggregation and admin dashboard aggregation.
- Admin course-visibility oversight and `/api/admin/health` database/traffic/storage/AWS-ready metrics.
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

Tests use isolated SQLite data and do not modify Supabase. Coverage includes Cognito identity exchange, course/lesson CRUD, protected content, uploads, enrollment, progress, assessment-gated certificates, instructor applications, approval, dashboards, and health metrics.

## Not implemented

- Server-generated PDF/S3 certificate delivery (the frontend certificate can already be printed/saved as PDF).
- General admin account suspension/deletion and arbitrary role editing.
- Versioned Alembic migrations and shared production traffic metrics.

## Optional AWS metrics

Keep this disabled locally:

```dotenv
AWS_MONITORING_ENABLED=false
```

When enabled, the Admin Health page can read S3 CloudWatch daily storage metrics and Cost Explorer month-to-date cost/credit records. Grant the backend only `cloudwatch:GetMetricStatistics` and `ce:GetCostAndUsage`; do not grant billing mutation permissions. AWS values may be delayed.
