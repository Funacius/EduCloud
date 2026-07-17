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

Open `http://127.0.0.1:8000/docs` to inspect and call the API. Public GET
endpoints can be tested directly. Authentication is still a project
placeholder, so use the automated tests below to exercise protected
instructor CRUD endpoints.

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
