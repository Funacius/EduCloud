# EduCloud Lite Backend

FastAPI skeleton for authentication, course, lesson, enrollment, progress, and upload APIs.

## TODO

- Backend Core Developer: implement authentication, JWT, roles, users, and database setup.
- Backend Business Logic Developer: implement models and service logic.
- API Developer - Course & Lesson: implement course and lesson route behavior.
- API Developer - Enrollment, Upload & Testing: implement enrollment, progress, upload, and test support.

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

For local development without PostgreSQL, set `DATABASE_URL` to SQLite before
starting the API:

```powershell
$env:DATABASE_URL="sqlite:///./educloud-local.db"
uvicorn main:app --reload
```

Open `http://127.0.0.1:8001/docs` to inspect and call the API. Public GET
endpoints can be tested directly. Authentication is still a project
placeholder, so use the automated tests below to exercise protected
instructor CRUD endpoints.

## Supabase

Use Supabase as the PostgreSQL database while keeping FastAPI on your machine:

1. In the Supabase project dashboard, choose **Connect** and copy the
   **Session Pooler** URI on port `5432`. This mode works on IPv4 networks and
   suits a persistent local FastAPI process.
2. Copy `.env.example` to `.env`. Do not commit `.env` or paste its password
   into Postman.
3. Set these values in `.env`:

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg2://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
ENABLE_DEV_AUTH=true
DEV_INSTRUCTOR_USER_ID=900001
```

Use the exact host, username, and region shown by Supabase. Replace the URI
scheme with `postgresql+psycopg2` and URL-encode special characters in the
password.

Check the connection and seed the instructor required by the Course foreign
key:

```powershell
python -m scripts.check_database
python -m scripts.seed_dev_user
uvicorn main:app --reload --port 8001
```

Starting the app creates the current SQLAlchemy tables when they do not exist.
The seed command is idempotent and only maintains the development instructor
with ID `900001`.

Never enable `ENABLE_DEV_AUTH` outside local development. Replace this
temporary flow with real JWT authentication before deployment.

## Postman

Import `api/postman/EduCloud.postman_collection.json`. The collection defaults
to:

```text
base_url = http://127.0.0.1:8001/api
token = dev-instructor-token
```

Run the Course/Lesson requests in this order:

1. `Courses / Get Courses`
2. `Courses / Create Course`
3. `Courses / Get Course Detail`
4. `Courses / Update Course`
5. `Lessons / Create Lesson`
6. `Lessons / Get Lessons`
7. `Lessons / Update Lesson`
8. `Lessons / Delete Lesson`
9. `Courses / Delete Course`

The create requests automatically save `course_id` and `lesson_id` as
collection variables, so later requests use the rows that were just created.
You can confirm the changes in Supabase **Table Editor** under `courses` and
`lessons`.

## Test

From the `backend` directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pytest -q
```

The Course/Lesson tests use an isolated in-memory SQLite database. They cover
course CRUD, lesson CRUD, course detail, listing, validation, and instructor
authorization without changing the development database.
