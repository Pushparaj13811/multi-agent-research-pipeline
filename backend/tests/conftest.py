import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
async def auth_client(app):
    """Client with a valid auth token for testing protected endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Register a test user
        response = await ac.post("/api/auth/register", json={
            "email": f"test-{uuid.uuid4().hex[:8]}@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
        })
        if response.status_code == 201:
            token = response.json()["access_token"]
            ac.headers["Authorization"] = f"Bearer {token}"
        yield ac
