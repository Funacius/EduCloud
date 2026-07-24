import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.config import settings
from app.database import Base, get_db
from app.middleware.auth_middleware import get_current_user
from app.routes import assessment_routes, course_routes, lesson_routes, upload_routes


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def app():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSession()

    test_app = FastAPI()
    test_app.include_router(course_routes.router, prefix="/api")
    test_app.include_router(lesson_routes.router, prefix="/api")
    test_app.include_router(upload_routes.router, prefix="/api")
    test_app.include_router(assessment_routes.router, prefix="/api")

    def override_db():
        yield db

    test_app.dependency_overrides[get_db] = override_db
    test_app.dependency_overrides[get_current_user] = lambda: {
        "user_id": 1,
        "role": "instructor",
    }

    yield test_app
    db.close()


@pytest.fixture
def client(app):
    with TestClient(app) as test_client:
        yield test_client


def create_course(client: TestClient) -> int:
    response = client.post(
        "/api/courses",
        json={
            "title": "AWS Cloud Foundations",
            "description": "Core AWS services and architecture concepts.",
            "level": "Beginner",
            "category": "Cloud Computing",
            "learning_outcomes": ["Identify core AWS services"],
            "requirements": ["A computer with internet access"],
            "price": 0,
            "status": "draft",
        },
    )

    assert response.status_code == 200
    return response.json()["data"]["id"]


def test_course_and_lesson_crud(client: TestClient):
    course_id = create_course(client)

    assert client.get("/api/courses").json()["data"] == []
    assert client.get(f"/api/courses/{course_id}").status_code == 404

    lesson_response = client.post(
        f"/api/courses/{course_id}/lessons",
        json={"title": "Introduction", "content": "Welcome", "order_index": 0},
    )
    assert lesson_response.status_code == 200
    lesson_id = lesson_response.json()["data"]["id"]

    detail_response = client.get(f"/api/courses/{course_id}/manage")
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["lessons"][0]["id"] == lesson_id
    assert detail_response.json()["data"]["level"] == "Beginner"
    assert detail_response.json()["data"]["learning_outcomes"] == ["Identify core AWS services"]

    assessment_response = client.put(
        f"/api/instructor/courses/{course_id}/assessment",
        json={
            "title": "Final knowledge check",
            "time_limit_minutes": 15,
            "passing_score": 70,
            "max_attempts": 3,
            "is_published": True,
            "questions": [{
                "prompt": "Which service stores objects?",
                "options": ["Amazon S3", "Amazon EC2"],
                "correct_option_index": 0,
                "order_index": 0,
            }],
        },
    )
    assert assessment_response.status_code == 200

    publish_response = client.put(f"/api/courses/{course_id}", json={"status": "published"})
    assert publish_response.status_code == 200
    assert len(client.get("/api/courses").json()["data"]) == 1
    public_detail = client.get(f"/api/courses/{course_id}").json()["data"]
    assert public_detail["lessons"][0] == {
        "id": lesson_id,
        "title": "Introduction",
        "order_index": 0,
        "has_video": False,
    }

    update_lesson_response = client.put(
        f"/api/lessons/{lesson_id}",
        json={"title": "AWS Introduction"},
    )
    assert update_lesson_response.status_code == 200
    assert update_lesson_response.json()["data"]["title"] == "AWS Introduction"

    update_course_response = client.put(
        f"/api/courses/{course_id}",
        json={
            "title": "AWS Cloud Essentials",
            "status": "hidden",
            "level": "Intermediate",
            "requirements": ["Basic AWS knowledge"],
        },
    )
    assert update_course_response.status_code == 200
    assert update_course_response.json()["data"]["title"] == "AWS Cloud Essentials"
    assert update_course_response.json()["data"]["status"] == "hidden"
    assert update_course_response.json()["data"]["level"] == "Intermediate"
    assert update_course_response.json()["data"]["requirements"] == ["Basic AWS knowledge"]

    hidden_list_response = client.get("/api/courses")
    assert hidden_list_response.status_code == 200
    assert hidden_list_response.json()["data"] == []

    assert client.delete(f"/api/lessons/{lesson_id}").status_code == 200
    assert client.delete(f"/api/courses/{course_id}").status_code == 200
    assert client.get(f"/api/courses/{course_id}").status_code == 404


def test_course_validation_rejects_short_title(client: TestClient):
    response = client.post("/api/courses", json={"title": "A"})

    assert response.status_code == 422


def test_instructor_can_list_owned_courses(client: TestClient):
    course_id = create_course(client)

    response = client.get("/api/courses/mine")

    assert response.status_code == 200
    assert [course["id"] for course in response.json()["data"]] == [course_id]


def test_instructor_can_upload_lesson_files(client: TestClient, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_STORAGE", "local")
    monkeypatch.setattr(settings, "LOCAL_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(settings, "PUBLIC_BASE_URL", "http://testserver")
    course_id = create_course(client)

    material_response = client.post(
        "/api/upload/lesson-material",
        data={"course_id": str(course_id)},
        files={"file": ("lesson-notes.pdf", b"pdf-content", "application/pdf")},
    )
    video_response = client.post(
        "/api/upload/video",
        data={"course_id": str(course_id)},
        files={"file": ("lesson.mp4", b"video-content", "video/mp4")},
    )

    assert material_response.status_code == 200
    assert material_response.json()["data"]["storage"] == "local"
    assert video_response.status_code == 200
    assert video_response.json()["data"]["url"].startswith("http://testserver/uploads/videos/")
    assert len(list(tmp_path.rglob("*.pdf"))) == 1
    assert len(list(tmp_path.rglob("*.mp4"))) == 1


def test_upload_rejects_unsupported_file_type(client: TestClient, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_STORAGE", "local")
    monkeypatch.setattr(settings, "LOCAL_UPLOAD_DIR", str(tmp_path))
    course_id = create_course(client)

    response = client.post(
        "/api/upload/lesson-material",
        data={"course_id": str(course_id)},
        files={"file": ("script.exe", b"not-allowed", "application/octet-stream")},
    )

    assert response.status_code == 415


def test_instructor_can_import_remote_thumbnail(client: TestClient, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_STORAGE", "local")
    monkeypatch.setattr(settings, "LOCAL_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(settings, "PUBLIC_BASE_URL", "http://testserver")
    monkeypatch.setattr(
        upload_routes,
        "download_remote_image",
        lambda url: (b"\x89PNG\r\n\x1a\nimage-content", "image/png", ".png"),
    )
    course_id = create_course(client)

    response = client.post(
        "/api/upload/course-thumbnail/import",
        json={"course_id": course_id, "url": "https://images.example.com/course.png"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["content_type"] == "image/png"
    assert response.json()["data"]["url"].startswith("http://testserver/uploads/thumbnails/")
    assert len(list(tmp_path.rglob("*.png"))) == 1


def test_student_cannot_create_course(app):
    app.dependency_overrides[get_current_user] = lambda: {
        "user_id": 2,
        "role": "student",
    }

    with TestClient(app) as client:
        response = client.post("/api/courses", json={"title": "AWS Basics"})

    assert response.status_code == 403
    assert response.json()["detail"] == "Instructor role required"


def test_student_cannot_read_instructor_lesson_endpoint(app):
    with TestClient(app) as instructor_client:
        course_id = create_course(instructor_client)
        instructor_client.post(f"/api/courses/{course_id}/lessons", json={"title": "Private lesson", "order_index": 0})

    app.dependency_overrides[get_current_user] = lambda: {"user_id": 2, "role": "student"}
    with TestClient(app) as student_client:
        response = student_client.get(f"/api/courses/{course_id}/lessons")

    assert response.status_code == 403
