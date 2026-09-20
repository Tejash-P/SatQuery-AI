from fastapi.testclient import TestClient

from app.core import security
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User
from app.models.project import Project


def _create_user(email: str, password: str = "Secret123!", role: str = "VIEWER") -> User:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(
                email=email,
                hashed_password=security.get_password_hash(password),
                role=role,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


def test_admin_can_grant_role_to_user():
    admin = _create_user("admin-rbac@example.com", role="ADMIN")
    target = _create_user("viewer-rbac@example.com", role="VIEWER")

    token = security.create_access_token(admin.id)
    client = TestClient(app)

    response = client.patch(
        f"/api/v1/auth/users/{target.id}/role",
        json={"role": "ANALYST"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["role"] == "ANALYST"


def test_viewer_cannot_create_project():
    viewer = _create_user("viewer-create-rbac@example.com", role="VIEWER")
    token = security.create_access_token(viewer.id)
    client = TestClient(app)

    response = client.post(
        "/api/v1/projects/",
        json={"name": "Viewer project", "description": "Should be rejected"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_viewer_cannot_submit_analysis():
    viewer = _create_user("viewer-analysis-rbac@example.com", role="VIEWER")
    token = security.create_access_token(viewer.id)
    client = TestClient(app)

    response = client.post(
        "/api/v1/analysis/query",
        json={"project_id": 1, "query": "List the land cover classes"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_viewer_can_read_analyst_project_with_attribution():
    analyst = _create_user("shared-analyst-rbac@example.com", role="ANALYST")
    viewer = _create_user("shared-viewer-rbac@example.com", role="VIEWER")
    db = SessionLocal()
    try:
        project = Project(
            name="Shared RBAC workspace",
            description="Visible to all authenticated roles",
            owner_id=analyst.id,
            status="ACTIVE",
        )
        db.add(project)
        db.commit()
    finally:
        db.close()

    token = security.create_access_token(viewer.id)
    client = TestClient(app)
    response = client.get(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    shared_project = next(item for item in response.json() if item["name"] == "Shared RBAC workspace")
    assert shared_project["owner_email"] == "shared-analyst-rbac@example.com"
    assert shared_project["owner_role"] == "ANALYST"
