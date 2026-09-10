"""Exercise the real service and routes; only external provider calls are mocked."""
import json
from unittest.mock import AsyncMock

import pytest

from app.config import Settings
from app.core.exceptions import AIProviderError
from app.services import ai_service


def settings(**overrides):
    return Settings(_env_file=None, gemini_api_key=overrides.pop("gemini_api_key", ""),
                    openai_api_key=overrides.pop("openai_api_key", ""), **overrides)


@pytest.mark.parametrize("key", ["", "   ", "youyour_gemini_api_key_here", "your-openai-api-key", "sk-your-key-here", "PLACEHOLDER", "change-me"])
def test_placeholder_keys(key):
    config = settings(gemini_api_key=key, openai_api_key=key)
    assert config.gemini_api_key == config.openai_api_key == ""


@pytest.mark.asyncio
@pytest.mark.parametrize("diagram_type,node_type", list(zip(ai_service.DIAGRAM_TYPE_LABELS, [
    "useCaseNode", "classNode", "sequenceLifelineNode", "activityActionNode",
    "erEntityNode", "stateNode", "componentNode", "deploymentNode",
])))
@pytest.mark.parametrize("mode", ["unconfigured", "fallback", "unavailable"])
async def test_all_ai_routes(authed_client, monkeypatch, diagram_type, node_type, mode):
    configured = mode != "unconfigured"
    monkeypatch.setattr(ai_service, "_settings", settings(
        gemini_api_key="test-gemini" if configured else "youyour_gemini_api_key_here",
        openai_api_key="test-openai" if configured else "",
    ))
    first = AsyncMock(side_effect=AIProviderError("secret provider exception"))
    second = AsyncMock()
    monkeypatch.setattr(ai_service, "_call_gemini", first)
    monkeypatch.setattr(ai_service, "_call_openai", second)
    diagram = {"name": "Test", "type": diagram_type, "nodes": [
        {"id": "n1", "type": node_type, "position": {"x": 0, "y": 0}, "data": {"name": "User"}},
    ], "edges": []}
    results = [diagram, {**diagram, "applied": ["Renamed node"], "message": "Updated"}, {
        "overview": "A system", "entities": [{"name": "User", "kind": node_type}],
        "relationships": [], "architecture": "Model", "problems": [], "suggestions": [],
    }]
    requests = [
        ("generate", {"requirements": "A system that manages users and orders", "type": diagram_type}),
        ("modify", {"instructions": "Rename the first node", "diagram": diagram}),
        ("explain", {"diagram": diagram}),
    ]
    for (action, body), result in zip(requests, results):
        second.return_value = json.dumps(result)
        second.side_effect = AIProviderError("secret upstream error") if mode == "unavailable" else None
        response = await authed_client.post(f"/ai/{action}-diagram", json=body)
        assert response.status_code == {"fallback": 200, "unconfigured": 400, "unavailable": 502}[mode]
        assert "secret" not in response.text
        if mode == "unconfigured":
            assert "AI provider not configured" in response.json()["detail"]
        elif mode == "fallback":
            assert set(result) - {"name", "type"} <= response.json().keys()
    assert first.await_count == second.await_count == (3 if configured else 0)


@pytest.mark.asyncio
@pytest.mark.parametrize("preferred", ["gemini", "openai"])
async def test_provider_priority(monkeypatch, preferred):
    monkeypatch.setattr(ai_service, "_settings", settings(
        gemini_api_key="test-gemini", openai_api_key="test-openai", ai_provider=preferred))
    primary, secondary = AsyncMock(return_value="ok"), AsyncMock(return_value="fallback")
    monkeypatch.setattr(ai_service, f"_call_{preferred}", primary)
    monkeypatch.setattr(ai_service, f"_call_{'openai' if preferred == 'gemini' else 'gemini'}", secondary)
    assert await ai_service._call_ai("prompt") == "ok"
    secondary.assert_not_awaited()
    primary.side_effect = AIProviderError()
    assert await ai_service._call_ai("prompt") == "fallback"
