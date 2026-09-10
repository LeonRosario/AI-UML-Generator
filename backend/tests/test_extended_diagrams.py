"""New types exercise the real routes/service/persistence, mocking only the LLM."""
import copy
import json
from unittest.mock import AsyncMock

import pytest
from pydantic import ValidationError

from app.schemas.gantt import GanttChart
from app.services import ai_service


def schedule():
    return {"tasks": [
        {"id": "design", "name": "Design checkout", "start": "2026-09-10", "duration": 3,
         "assignee": "Design", "progress": 25, "milestone": False, "dependencies": []},
        {"id": "launch", "name": "Launch", "start": "2026-09-13", "duration": 0,
         "assignee": "Product", "progress": 0, "milestone": True, "dependencies": ["design"]},
    ]}


@pytest.mark.parametrize("kind,shape", [("flowchart", "flowDecisionNode"), ("network", "networkFirewallNode"), ("architecture", "archQueueNode"), ("gantt", None)])
async def test_new_type_ai_routes(authed_client, monkeypatch, kind, shape):
    generated = {"name": "Checkout delivery", "type": kind, "nodes": [], "edges": []}
    if kind == "gantt":
        generated["gantt"] = schedule()
    else:
        generated["nodes"] = [{"id": "n", "type": shape, "position": {"x": 0, "y": 0}, "data": {"name": "Checkout"}}]
    provider = AsyncMock(return_value=json.dumps(generated))
    monkeypatch.setattr(ai_service, "_call_ai", provider)
    response = await authed_client.post("/ai/generate-diagram", json={"type": kind, "requirements": "Design checkout in three days, then launch with Product."})
    assert response.status_code == 200, response.text
    assert response.json()["type"] == kind
    assert ("duration" if kind == "gantt" else shape) in provider.call_args.args[0]
    modified = {**generated, "applied": ["Updated"], "message": "Updated"}
    if kind == "gantt":
        modified["gantt"] = copy.deepcopy(generated["gantt"])
        modified["gantt"]["tasks"][0]["name"] = "Design new checkout"
    provider.return_value = json.dumps(modified)
    response = await authed_client.post("/ai/modify-diagram", json={"diagram": generated, "instructions": "Rename design to Design new checkout"})
    assert response.status_code == 200, response.text
    if kind == "gantt":
        assert response.json()["gantt"]["tasks"][0]["name"] == "Design new checkout"
    provider.return_value = json.dumps({"overview": "Checkout plan", "entities": [], "relationships": [], "architecture": "Schedule", "problems": [], "suggestions": []})
    response = await authed_client.post("/ai/explain-diagram", json={"diagram": generated})
    assert response.status_code == 200
    assert response.json()["overview"] == "Checkout plan"
    if kind == "gantt":
        assert "scheduling risks" in provider.call_args.args[0]


async def test_schedule_and_editor_metadata_survive_save(authed_client):
    payload = {"id": "schedule-save", "name": "Schedule", "type": "gantt", "nodes": [], "edges": [], "gantt": schedule(),
               "layers": [{"id": "default", "name": "Main", "visible": False, "locked": True}],
               "preferences": {"theme": "ocean", "routing": "straight", "snapToGrid": False}}
    response = await authed_client.put("/diagrams/schedule-save", json=payload)
    assert response.status_code == 200, response.text
    saved = (await authed_client.get("/diagrams/schedule-save")).json()
    for key in ("gantt", "layers", "preferences"):
        assert saved[key] == payload[key]


@pytest.mark.parametrize("mutation", ["date", "duration", "milestone", "cycle", "reference", "duplicate", "order", "progress"])
def test_invalid_schedules_rejected(mutation):
    chart = schedule()
    a, b = chart["tasks"]
    if mutation == "date": a["start"] = "2026-02-30"
    if mutation == "duration": a["duration"] = -1
    if mutation == "milestone": b["duration"] = 1
    if mutation == "cycle": a["dependencies"] = ["launch"]
    if mutation == "reference": b["dependencies"] = ["missing"]
    if mutation == "duplicate": b["id"] = a["id"]
    if mutation == "order": b["start"] = "2026-09-11"
    if mutation == "progress": a["progress"] = 110
    with pytest.raises(ValidationError):
        GanttChart.model_validate(chart)
    with pytest.raises(ai_service.AIProviderError):
        ai_service._validate_generate_response({"gantt": chart}, "gantt")


async def test_invalid_gantt_provider_output_reports_error(authed_client, monkeypatch):
    monkeypatch.setattr(ai_service, "_call_ai", AsyncMock(return_value=json.dumps({"gantt": {"tasks": []}})))
    for endpoint, body in [("generate-diagram", {"type": "gantt", "requirements": "Build a project schedule"}),
                           ("modify-diagram", {"diagram": {"type": "gantt", "gantt": schedule()}, "instructions": "Update"})]:
        response = await authed_client.post(f"/ai/{endpoint}", json=body)
        assert response.status_code == 502


def test_leap_day_and_exclusive_end():
    chart = schedule()
    chart["tasks"][0].update(start="2028-02-29", duration=1)
    chart["tasks"][1]["start"] = "2028-03-01"
    assert GanttChart.model_validate(chart).tasks[0].duration == 1
