import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.mark.asyncio
async def test_app_imports():
    assert app.title == "Medcurial Worker"


def test_health_check():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
