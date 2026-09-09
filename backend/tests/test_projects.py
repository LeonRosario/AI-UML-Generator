import pytest


@pytest.mark.asyncio
async def test_projects_crud(authed_client):
    response = await authed_client.post("/projects", json={"name": "Project", "description": "Test"})
    assert response.status_code == 201
    project_id = response.json()["id"]
    url = f"/projects/{project_id}"
    assert (await authed_client.get(url)).json()["name"] == "Project"
    assert project_id in [p["id"] for p in (await authed_client.get("/projects")).json()]
    response = await authed_client.put(url, json={"name": "Renamed", "description": "Updated"})
    assert response.status_code == 200
    assert (await authed_client.get(url)).json()["name"] == "Renamed"
    assert (await authed_client.delete(url)).status_code == 200
    assert (await authed_client.get(url)).status_code == 404


@pytest.mark.asyncio
async def test_projects_require_auth(client):
    assert (await client.get("/projects")).status_code == 401
    assert (await client.post("/projects", json={"name": "Test"})).status_code == 401


@pytest.mark.asyncio
async def test_projects_isolate_owners(authed_client, second_client):
    project = (await authed_client.post("/projects", json={"name": "Private"})).json()
    url = f"/projects/{project['id']}"
    assert project["id"] not in [p["id"] for p in (await second_client.get("/projects")).json()]
    assert (await second_client.get(url)).status_code == 403
    assert (await second_client.put(url, json={"name": "Stolen"})).status_code == 403
    assert (await second_client.delete(url)).status_code == 403
