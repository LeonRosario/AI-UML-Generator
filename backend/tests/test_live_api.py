"""Real HTTP smoke test, including startup and a fresh on-disk SQLite DB."""
import os
from pathlib import Path
import socket
import subprocess
import sys
import time

import httpx

from app.services.ai_service import DIAGRAM_TYPE_LABELS


def test_live_api(tmp_path):
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    env = {**os.environ, "DATABASE_URL": f"sqlite+aiosqlite:///{(tmp_path / 'fresh.db').as_posix()}",
           "GEMINI_API_KEY": "youyour_gemini_api_key_here", "OPENAI_API_KEY": "",
           "APP_ENV": "test", "DEBUG": "false", "JWT_SECRET_KEY": "live-test-secret-only"}
    with (tmp_path / "server.log").open("w+") as log:
        process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
            cwd=Path(__file__).resolve().parents[1], env=env, stdout=log, stderr=log,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        try:
            with httpx.Client(base_url=f"http://127.0.0.1:{port}", timeout=5) as client:
                for _ in range(100):
                    if process.poll() is not None:
                        log.seek(0)
                        raise AssertionError(log.read())
                    try:
                        if client.get("/health").status_code == 200:
                            break
                    except httpx.ConnectError:
                        pass
                    time.sleep(0.1)
                else:
                    raise AssertionError("Backend did not start")

                assert client.get("/docs").status_code == 200
                assert client.get("/openapi.json").status_code == 200
                user = {"name": "Live User", "email": "live@example.com", "password": "password123"}
                assert client.post("/auth/register", json=user).status_code == 201
                assert client.get("/auth/me").json()["user"]["email"] == user["email"]
                assert client.post("/auth/logout").status_code == 200
                assert client.get("/auth/me").status_code == 401
                assert client.post("/auth/login", json={"email": user["email"], "password": user["password"]}).status_code == 200
                for email in (user["email"], "unknown@example.com"):
                    assert client.post("/auth/forgot-password", json={"email": email}).status_code == 200

                for resource in ("projects", "diagrams"):
                    payload = {"name": "Smoke test"}
                    if resource == "projects":
                        response = client.post("/projects", json=payload)
                        assert response.status_code == 201
                        item_id = response.json()["id"]
                    else:
                        item_id = "smoke-diagram"
                        payload.update(id=item_id, type="class", nodes=[], edges=[])
                        assert client.put(f"/diagrams/{item_id}", json=payload).status_code == 200
                    url = f"/{resource}/{item_id}"
                    assert client.get(url).json()["name"] == "Smoke test"
                    assert item_id in [item["id"] for item in client.get(f"/{resource}").json()]
                    payload["name"] = "Updated"
                    assert client.put(url, json=payload).status_code == 200
                    assert client.get(url).json()["name"] == "Updated"
                    assert client.delete(url).status_code == 200
                    assert client.get(url).status_code == 404

                for diagram_type in DIAGRAM_TYPE_LABELS:
                    diagram = {"name": "Test", "type": diagram_type, "nodes": [], "edges": []}
                    for action, body in (
                        ("generate", {"requirements": "A system managing users and orders", "type": diagram_type}),
                        ("modify", {"instructions": "Add a user node", "diagram": diagram}),
                        ("explain", {"diagram": diagram}),
                    ):
                        response = client.post(f"/ai/{action}-diagram", json=body)
                        assert response.status_code == 400
                        assert "AI provider not configured" in response.json()["detail"]
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
