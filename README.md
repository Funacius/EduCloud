# EduCloud Lite

EduCloud Lite is a React + FastAPI learning management system backed by Supabase PostgreSQL and Amazon Cognito authentication. It supports verified-email signup, password recovery, role-based pages, course management, timed final assessments, learning progress, printable certificates, uploads, content governance, and live health dashboards.

## Latest implementation update

This change set is based on the last pushed commit `4db8c0a` (`Update project documentation`, July 17, 2026). It adds the following working flows:

- Replaced frontend-only/demo authentication behavior with Cognito email verification, resend-code, login token exchange, and two-step forgot-password/reset UI.
- Added Student/Instructor selection at signup. Instructor applicants remain Students until an Admin approves their application; rejected applications include a review note and can be resubmitted.
- Added Student profiles and certificate identity fields stored in Supabase.
- Added live Student learning data, resume-from-first-incomplete-lesson behavior, and Instructor enrollment/completion counts.
- Added Instructor-authored final assessments with configurable multiple-choice questions, correct answers, pass score, attempt limit, publication state, and backend-enforced time limit.
- Changed course completion so finishing lessons unlocks the final assessment; a certificate is issued only after a passing attempt.
- Added a branded certificate page with Student name, course, issue date, EduCloud logo, and Print/Save-as-PDF support without exposing the internal certificate identifier.
- Replaced fixed Admin/Student dashboard values with Supabase-backed aggregations, added Instructor application review, course visibility oversight, and a separate Admin Health page.
- Protected lesson content from public APIs, added role/ownership checks, uniqueness constraints, security headers, and demo rate limiting for sensitive authentication requests.
- Expanded automated backend coverage to 12 passing tests and verified the frontend production build.

S3 upload/delivery, server-generated certificate PDFs, CloudFront delivery, and production AWS observability remain intentionally deferred. Local uploads and browser-generated certificate PDFs continue to work.

## Implemented

- Amazon Cognito signup, six-digit email confirmation, resend code, login, and forgot/reset password.
- Reset-code requests pass through FastAPI and call Cognito only when the email is linked in Supabase via `cognito_sub`, while returning a generic anti-enumeration response.
- FastAPI validates Cognito ID tokens and exchanges them for 12-hour EduCloud JWTs containing the current Supabase role.
- Development student, instructor, and admin accounts stored in Supabase.
- Role guards for student, instructor, and admin pages.
- Published course catalog and course search loaded from Supabase.
- Instructor course CRUD, course settings, curriculum CRUD, thumbnails, videos, and materials.
- Student enrollment, Learning Page playlist, lesson completion, and course progress persisted in Supabase.
- Instructor-managed timed final assessments with configurable questions, answers, pass mark, attempt limit, and time limit.
- Student profile setup and automatic, idempotent certificate issuance only after all lessons are complete and the final assessment is passed.
- Printable EduCloud certificate page with student name, course, issue date, logo, and browser Save-as-PDF support.
- Student dashboard calculated from `enrollments`, `progress`, `courses`, and `lessons`.
- Instructor course list with live enrolled-student and completed-student counts.
- Signup choice for Student or Instructor; Instructor applicants are safely created as students and routed into the admin-approved application flow.
- Admin overview calculated from live users, roles, courses, lessons, and enrollments, with instructor approval and course visibility controls.
- Admin Health Monitoring page for API traffic, response time, database latency/size/row counts, local/S3-ready storage, service status, and optional AWS Cost Explorer/CloudWatch metrics.
- Public course APIs expose outlines only; lesson notes, videos, and materials require enrollment or course ownership.
- Basic auth rate limiting, API security headers, student-only enrollment/progress checks, and database uniqueness constraints.
- Swagger, Postman workspace, and isolated backend tests.

Cognito is configured for authentication. Local uploads work without S3. Certificates can be printed or saved as PDF from the browser; server-generated PDF storage remains part of the later S3 stage.

## Project status snapshot

This section is the current handoff summary for teammates and reviewers.

### Architecture

```text
React + Vite frontend (localhost:5173)
              |
              | Cognito signup/login + JSON / Bearer JWT
              v
Amazon Cognito User Pool (verified email and password recovery)
              |
              | verified Cognito ID token
              v
FastAPI backend (localhost:8001)
              |
              | SQLAlchemy + psycopg2, SSL
              v
Supabase hosted PostgreSQL
```

Supabase remains the application database and role authority; it is not used for authentication. Cognito owns passwords, confirmation codes, and password recovery. FastAPI verifies the Cognito token, maps its `sub` to `users.cognito_sub`, and issues an EduCloud JWT using the role stored in Supabase. Local bcrypt login remains development-only while seeded accounts are migrated.

### Database tables in active use

| Table | Purpose |
|---|---|
| `users` | Profile, email, application role, Cognito subject, and optional legacy password hash |
| `courses` | Course settings, publishing status, instructor ownership, and thumbnail URL |
| `lessons` | Ordered curriculum, notes, video URL, and material URL |
| `enrollments` | Student-to-course membership and enrollment status |
| `progress` | Per-student lesson completion state |
| `student_profiles` | Certificate name, birth date, organization, country, and student bio |
| `certificates` | One immutable certificate record per student/course completion |
| `instructor_requests` | Instructor applications, review status, admin notes, and reviewer audit data |
| `course_assessments` | Per-course final test settings, pass mark, timer, attempt limit, and publication state |
| `assessment_questions` | Multiple-choice questions, options, correct answers, and ordering |
| `assessment_attempts` | Timed student attempts, submitted answers, score, and pass/fail state |

Development compatibility migrations add missing course detail and user auth columns on startup. This is suitable for the current prototype; production should replace it with versioned Alembic migrations.

### Behavior by role

| Role | Working behavior |
|---|---|
| Student | Register/login, complete a profile, learn, take timed final assessments, print certificates, and submit/resubmit an instructor application |
| Instructor | Manage owned courses/lessons/final assessments, publish/hide content, upload resources, delete unused drafts, and view enrollment/certificate counts |
| Admin | Inspect metrics/recent users, approve/reject instructor applications, moderate course visibility, and monitor system health |

### Data integrity rules currently enforced

- Public registration always creates `student`; a client cannot register itself as admin.
- Course/lesson/upload mutations require instructor or admin authorization and ownership checks.
- Only published courses appear in the public catalog; draft/hidden course detail is not public.
- Public detail contains lesson titles only. Full notes, video URLs, and material URLs require enrollment, ownership, or Admin access.
- Enrollment and lesson progress are Student-only, enrollment accepts published courses only, and unique database indexes prevent duplicate enrollment/progress rows.
- A course must contain at least one lesson and a published final assessment before it can be published.
- Assessment deadlines and attempt limits are enforced by the backend, not only by the browser timer.
- Certificate issuance is idempotent and requires every lesson plus a passing assessment attempt; an issued completion cannot be undone.
- Existing eligible completions are backfilled after a passing attempt when the student opens My Learning or course progress.
- Student and admin dashboards calculate values from database rows; they contain no fixed demo metrics.
- The frontend automatically attaches the signed-in JWT to API requests.

### Remaining non-AWS limitations

- The certificate has a printable HTML template; automatic server-side PDF rendering/upload to S3 is reserved for the AWS stage (`certificates.file_url`).
- Admin can review instructor applications and course visibility, but general role editing and account suspension/deletion are not implemented.
- Traffic metrics are process-local and reset after backend restart. Production aggregation should use CloudWatch or another shared metrics store.
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
COGNITO_REGION=ap-southeast-1
COGNITO_USER_POOL_ID=ap-southeast-1_bIWZwCo0P
COGNITO_CLIENT_ID=6o2l010t3eusindbdhh99paud9
ALLOW_LEGACY_AUTH=true
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
| Admin (backup) | `admin2@educloud.local` |

These are development-only accounts. The seed command updates their password hashes each time it runs.

## Frontend UI verification

### Instructor

1. Sign in as the instructor and open **Instructor**.
2. Create a course as `Draft`.
3. Open **Edit**, add at least two lessons and optionally upload a video/material.
4. In **Final assessment**, add questions, choose correct options, set pass mark/time/attempt limit, publish the assessment, and save it.
5. Change the course status to `Published` and confirm it appears in the public catalog.

### Student

1. Register a new student; after registration, confirm the app opens **Profile**.
2. Save the certificate name and optional date of birth, organization, country, and bio; verify `student_profiles` in Supabase.
3. Open **Courses**, select a published course, and click **Start Course**; verify `enrollments`.
4. Mark every lesson complete and confirm **Take final test** appears.
5. Start the timed assessment, submit a passing answer set, and confirm the certificate-issued result.
6. Open **Profile**, open the certificate template, and test **Print / Save as PDF**.
7. Verify one matching row exists in `certificates` and one passed row exists in `assessment_attempts`.
8. Click **Start/Continue Course** again and confirm unfinished courses resume at the first incomplete lesson.

Return to the instructor's **All courses** page and verify the **Students** and **Completed** columns match `enrollments` and `certificates` in Supabase.

### Admin

1. Sign out, then sign in as admin.
2. After a student submits **Become an instructor** from Profile, confirm it appears in **Application review queue**.
3. Rejecting requires a review note; confirm the student can read that note and resubmit.
4. Approve the request and verify `users.role` changes to `instructor` and the request becomes `approved` in Supabase.
5. The approved user must sign out and sign in again before Instructor navigation appears.
6. Verify a student account cannot open `/admin` or call `/api/admin/dashboard`.
7. Use **Course oversight** to hide/publish a valid course.
8. Open **Health**, confirm database/traffic/storage/service metrics load and refresh.

## Presentation security checklist

- Set `ALLOW_LEGACY_AUTH=false` and `ENABLE_DEV_AUTH=false` outside local development.
- Replace `JWT_SECRET_KEY` with a long random secret and never commit `backend/.env`, AWS keys, database passwords, or Cognito secrets.
- Restrict `CORS_ORIGINS` to the deployed Amplify domain; keep HTTPS enabled everywhere.
- Use a least-privilege Supabase database account, retain SSL, enable backups, and avoid exposing its connection string to the frontend.
- Keep Cognito email verification and strong password policy enabled; optional MFA can be added for Admin accounts.
- Current bearer tokens live in `sessionStorage`; a production hardening step is short-lived access tokens plus Secure, HttpOnly, SameSite cookies and refresh-token rotation.
- Before S3 integration, keep the bucket private, use CloudFront OAC and signed URLs/cookies, store object keys instead of public URLs, and upload with short-lived presigned multipart requests.
- Add AWS Budgets alerts, CloudWatch alarms for 5xx/latency, and WAF managed rules/rate limits when deploying publicly.
- The included in-memory auth limiter and response security headers are appropriate for a demo. Multi-instance production should move rate limiting to WAF, API Gateway, or Redis.

## Verification commands

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q

cd ..\frontend
npm run build
```

See `backend/README.md`, `frontend/README.md`, and `api/README.md` for component-specific details.
