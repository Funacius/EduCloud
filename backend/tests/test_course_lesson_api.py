import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base, get_db
from app.middleware.auth_middleware import get_current_user
from app.routes import course_routes, lesson_routes


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
            "price": 0,
            "status": "published",
        },
    )

    assert response.status_code == 200
    return response.json()["data"]["id"]


def test_course_and_lesson_crud(client: TestClient):
    course_id = create_course(client)

    list_response = client.get("/api/courses")
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) == 1

    lesson_response = client.post(
        f"/api/courses/{course_id}/lessons",
        json={"title": "Introduction", "content": "Welcome", "order_index": 0},
    )
    assert lesson_response.status_code == 200
    lesson_id = lesson_response.json()["data"]["id"]

    detail_response = client.get(f"/api/courses/{course_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["lessons"][0]["id"] == lesson_id

    update_lesson_response = client.put(
        f"/api/lessons/{lesson_id}",
        json={"title": "AWS Introduction"},
    )
    assert update_lesson_response.status_code == 200
    assert update_lesson_response.json()["data"]["title"] == "AWS Introduction"

    update_course_response = client.put(
        f"/api/courses/{course_id}",
        json={"title": "AWS Cloud Essentials"},
    )
    assert update_course_response.status_code == 200
    assert update_course_response.json()["data"]["title"] == "AWS Cloud Essentials"

    assert client.delete(f"/api/lessons/{lesson_id}").status_code == 200
    assert client.delete(f"/api/courses/{course_id}").status_code == 200
    assert client.get(f"/api/courses/{course_id}").status_code == 404


def test_course_validation_rejects_short_title(client: TestClient):
    response = client.post("/api/courses", json={"title": "A"})

    assert response.status_code == 422


def test_student_cannot_create_course(app):
    app.dependency_overrides[get_current_user] = lambda: {
        "user_id": 2,
        "role": "student",
    }

    with TestClient(app) as client:
        response = client.post("/api/courses", json={"title": "AWS Basics"})

    assert response.status_code == 403
    assert response.json()["detail"] == "Instructor role required"
