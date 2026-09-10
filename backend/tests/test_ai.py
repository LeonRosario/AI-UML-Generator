from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.schemas.ai import AiEdgePayload, AiNodePayload, GenerateDiagramResponse

SAMPLE_DIAGRAM = {
    "id": "diag-ai-test",
    "name": "Test",
    "type": "class",
    "nodes": [
        {"id": "n1", "type": "classNode", "position": {"x": 0, "y": 0}, "data": {"name": "User"}},
        {"id": "n2", "type": "classNode", "position": {"x": 200, "y": 0}, "data": {"name": "Order"}},
    ],
    "edges": [
        {"id": "e1", "source": "n1", "target": "n2", "type": "association"}
    ],
}

MOCK_GENERATE_RESPONSE = GenerateDiagramResponse(
    name="E-commerce System — Class Diagram",
    type="class",
    nodes=[
        AiNodePayload(id="user", type="classNode", position={"x": 0, "y": 0}, data={"name": "User"}),
        AiNodePayload(id="order", type="classNode", position={"x": 200, "y": 0}, data={"name": "Order"}),
    ],
    edges=[
        AiEdgePayload(id="e1", source="user", target="order", type="association", label="places"),
    ],
)


@pytest.mark.asyncio
class TestGenerateDiagram:
    async def test_generate_requires_auth(self, client: AsyncClient):
        resp = await client.post("/ai/generate-diagram", json={
            "requirements": "An e-commerce system with users and orders",
            "type": "class",
        })
        assert resp.status_code == 401

    async def test_generate_success(self, authed_client: AsyncClient):
        with patch("app.services.ai_service.generate_diagram", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = MOCK_GENERATE_RESPONSE
            resp = await authed_client.post("/ai/generate-diagram", json={
                "requirements": "An e-commerce system with users and orders",
                "type": "class",
            })
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data
        assert "type" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["edges"], list)

    async def test_generate_short_requirements(self, authed_client: AsyncClient):
        resp = await authed_client.post("/ai/generate-diagram", json={
            "requirements": "hi",
            "type": "class",
        })
        assert resp.status_code == 422

    async def test_generate_invalid_type(self, authed_client: AsyncClient):
        resp = await authed_client.post("/ai/generate-diagram", json={
            "requirements": "An e-commerce system with users and orders",
            "type": "invalid-type",
        })
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestModifyDiagram:
    async def test_modify_requires_auth(self, client: AsyncClient):
        resp = await client.post("/ai/modify-diagram", json={
            "instructions": "Add a Payment class",
            "diagram": SAMPLE_DIAGRAM,
        })
        assert resp.status_code == 401

    async def test_modify_success(self, authed_client: AsyncClient):
        mock_result = {
            "nodes": SAMPLE_DIAGRAM["nodes"],
            "edges": SAMPLE_DIAGRAM["edges"],
            "applied": ["Added Payment class"],
            "message": "Applied 1 change.",
        }
        with patch("app.services.ai_service.modify_diagram", new_callable=AsyncMock) as mock_mod:
            from app.schemas.ai import ModifyDiagramResponse
            mock_mod.return_value = ModifyDiagramResponse(**mock_result)
            resp = await authed_client.post("/ai/modify-diagram", json={
                "instructions": "Add a Payment class",
                "diagram": SAMPLE_DIAGRAM,
            })
        assert resp.status_code == 200
        data = resp.json()
        assert "nodes" in data
        assert "edges" in data
        assert "applied" in data
        assert "message" in data


@pytest.mark.asyncio
class TestExplainDiagram:
    async def test_explain_requires_auth(self, client: AsyncClient):
        resp = await client.post("/ai/explain-diagram", json={"diagram": SAMPLE_DIAGRAM})
        assert resp.status_code == 401

    async def test_explain_success(self, authed_client: AsyncClient):
        mock_result = {
            "overview": "This class diagram models 2 entities.",
            "entities": [{"name": "User", "kind": "classNode"}, {"name": "Order", "kind": "classNode"}],
            "relationships": [{"from": "User", "to": "Order", "type": "association"}],
            "architecture": "Standard class diagram with associations.",
            "problems": [],
            "suggestions": ["Consider adding methods to classes."],
        }
        with patch("app.services.ai_service.explain_diagram", new_callable=AsyncMock) as mock_exp:
            from app.schemas.ai import ExplainDiagramResponse
            mock_exp.return_value = ExplainDiagramResponse(**mock_result)
            resp = await authed_client.post("/ai/explain-diagram", json={"diagram": SAMPLE_DIAGRAM})
        assert resp.status_code == 200
        data = resp.json()
        required = {"overview", "entities", "relationships", "architecture", "problems", "suggestions"}
        assert required.issubset(data.keys()), f"Missing: {required - data.keys()}"


@pytest.mark.asyncio
class TestHealthCheck:
    async def test_health(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
