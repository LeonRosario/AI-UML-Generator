from __future__ import annotations

import pytest
from httpx import AsyncClient

SAMPLE_DIAGRAM = {
    "id": "diag-test-001",
    "name": "Test Diagram",
    "type": "class",
    "nodes": [
        {"id": "n1", "type": "classNode", "position": {"x": 0, "y": 0}, "data": {"name": "User"}},
    ],
    "edges": [],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
}


@pytest.mark.asyncio
class TestDiagramCRUD:
    async def test_create_diagram(self, authed_client: AsyncClient):
        diag_id = "diag-create-001"
        payload = {**SAMPLE_DIAGRAM, "id": diag_id}
        resp = await authed_client.put(f"/diagrams/{diag_id}", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == diag_id
        assert data["name"] == SAMPLE_DIAGRAM["name"]
        assert data["type"] == SAMPLE_DIAGRAM["type"]
        assert isinstance(data["nodes"], list)

    async def test_list_diagrams(self, authed_client: AsyncClient):
        diag_id = "diag-list-001"
        payload = {**SAMPLE_DIAGRAM, "id": diag_id}
        await authed_client.put(f"/diagrams/{diag_id}", json=payload)
        resp = await authed_client.get("/diagrams")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        ids = [d["id"] for d in data]
        assert diag_id in ids

    async def test_get_diagram(self, authed_client: AsyncClient):
        diag_id = "diag-get-001"
        payload = {**SAMPLE_DIAGRAM, "id": diag_id}
        await authed_client.put(f"/diagrams/{diag_id}", json=payload)
        resp = await authed_client.get(f"/diagrams/{diag_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == diag_id
        assert "nodes" in data
        assert "edges" in data

    async def test_update_diagram(self, authed_client: AsyncClient):
        diag_id = "diag-update-001"
        payload = {**SAMPLE_DIAGRAM, "id": diag_id}
        await authed_client.put(f"/diagrams/{diag_id}", json=payload)
        updated = {**payload, "name": "Updated Diagram"}
        resp = await authed_client.put(f"/diagrams/{diag_id}", json=updated)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Diagram"

    async def test_delete_diagram(self, authed_client: AsyncClient):
        diag_id = "diag-to-delete"
        await authed_client.put(f"/diagrams/{diag_id}", json={**SAMPLE_DIAGRAM, "id": diag_id})
        resp = await authed_client.delete(f"/diagrams/{diag_id}")
        assert resp.status_code == 200
        # Verify it's gone
        resp2 = await authed_client.get(f"/diagrams/{diag_id}")
        assert resp2.status_code == 404

    async def test_get_nonexistent_diagram(self, authed_client: AsyncClient):
        resp = await authed_client.get("/diagrams/does-not-exist")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestDiagramAuth:
    async def test_list_requires_auth(self, client: AsyncClient):
        resp = await client.get("/diagrams")
        assert resp.status_code == 401

    async def test_get_requires_auth(self, client: AsyncClient):
        resp = await client.get("/diagrams/any-id")
        assert resp.status_code == 401

    async def test_save_requires_auth(self, client: AsyncClient):
        resp = await client.put("/diagrams/any-id", json=SAMPLE_DIAGRAM)
        assert resp.status_code == 401

    async def test_delete_requires_auth(self, client: AsyncClient):
        resp = await client.delete("/diagrams/any-id")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestDiagramOwnership:
    async def test_user_cannot_read_other_users_diagram(
        self, authed_client: AsyncClient, second_client: AsyncClient
    ):
        diag_id = "diag-ownership-test"
        # User 1 creates a diagram
        await authed_client.put(f"/diagrams/{diag_id}", json={**SAMPLE_DIAGRAM, "id": diag_id})
        # User 2 tries to read it
        resp = await second_client.get(f"/diagrams/{diag_id}")
        assert resp.status_code in (403, 404)  # Must not return 200

    async def test_user_cannot_delete_other_users_diagram(
        self, authed_client: AsyncClient, second_client: AsyncClient
    ):
        diag_id = "diag-ownership-delete"
        await authed_client.put(f"/diagrams/{diag_id}", json={**SAMPLE_DIAGRAM, "id": diag_id})
        resp = await second_client.delete(f"/diagrams/{diag_id}")
        assert resp.status_code in (403, 404)

    async def test_response_shape_matches_frontend_contract(self, authed_client: AsyncClient):
        """Verify the exact fields the frontend TypeScript types expect."""
        diag_id = "diag-contract-001"
        payload = {**SAMPLE_DIAGRAM, "id": diag_id}
        await authed_client.put(f"/diagrams/{diag_id}", json=payload)
        resp = await authed_client.get(f"/diagrams/{diag_id}")
        data = resp.json()
        # These fields MUST be present for the frontend to work
        required_fields = {"id", "name", "type", "nodes", "edges", "createdAt", "updatedAt"}
        assert required_fields.issubset(data.keys()), f"Missing fields: {required_fields - data.keys()}"
