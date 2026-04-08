import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_research_validation_no_auth(client):
    """Unauthenticated requests should get 401."""
    response = await client.post("/api/research", json={"query": "test", "mode": "topic"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_research_validation_with_auth(auth_client):
    """Authenticated requests with invalid data should get 422."""
    response = await auth_client.post("/api/research", json={})
    assert response.status_code == 422

    response = await auth_client.post("/api/research", json={"query": "test", "mode": "invalid"})
    assert response.status_code == 422
