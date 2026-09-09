from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRegistration:
    async def test_register_success(self, client: AsyncClient):
        resp = await client.post("/auth/register", json={
            "name": "Alice Smith",
            "email": "alice@example.com",
            "password": "securepass1",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "user" in data
        assert data["user"]["email"] == "alice@example.com"
        assert data["user"]["name"] == "Alice Smith"
        assert "passwordHash" not in str(data)
        assert "hashed_password" not in str(data)

    async def test_register_duplicate_email(self, client: AsyncClient):
        payload = {"name": "Bob", "email": "bob@example.com", "password": "password12"}
        await client.post("/auth/register", json=payload)
        resp = await client.post("/auth/register", json=payload)
        assert resp.status_code == 409
        assert "detail" in resp.json()

    async def test_register_short_password(self, client: AsyncClient):
        resp = await client.post("/auth/register", json={
            "name": "Charlie",
            "email": "charlie@example.com",
            "password": "short",
        })
        assert resp.status_code == 422

    async def test_register_invalid_email(self, client: AsyncClient):
        resp = await client.post("/auth/register", json={
            "name": "Dave",
            "email": "not-an-email",
            "password": "password123",
        })
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        await client.post("/auth/register", json={
            "name": "Eve", "email": "eve@example.com", "password": "password123"
        })
        resp = await client.post("/auth/login", json={
            "email": "eve@example.com", "password": "password123", "remember": False
        })
        assert resp.status_code == 200
        assert resp.json()["user"]["email"] == "eve@example.com"
        # Cookie must be set
        assert "umlforge_session" in resp.cookies

    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/auth/register", json={
            "name": "Frank", "email": "frank@example.com", "password": "correctpass"
        })
        resp = await client.post("/auth/login", json={
            "email": "frank@example.com", "password": "wrongpass", "remember": False
        })
        assert resp.status_code == 401
        assert "detail" in resp.json()

    async def test_login_unknown_email(self, client: AsyncClient):
        resp = await client.post("/auth/login", json={
            "email": "nobody@example.com", "password": "anything", "remember": False
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestMe:
    async def test_me_authenticated(self, authed_client: AsyncClient):
        resp = await authed_client.get("/auth/me")
        assert resp.status_code == 200
        assert "user" in resp.json()

    async def test_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/auth/me")
        assert resp.status_code == 401

    async def test_me_invalid_token(self, client: AsyncClient):
        client.cookies.set("umlforge_session", "invalid.jwt.token")
        resp = await client.get("/auth/me")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestLogout:
    async def test_logout(self, authed_client: AsyncClient):
        resp = await authed_client.post("/auth/logout")
        assert resp.status_code == 200
        # After logout, me should return 401
        resp2 = await authed_client.get("/auth/me")
        assert resp2.status_code == 401


@pytest.mark.asyncio
class TestForgotPassword:
    async def test_forgot_password_always_200(self, client: AsyncClient):
        # Always returns 200 regardless of email existence
        resp = await client.post("/auth/forgot-password", json={"email": "anyone@example.com"})
        assert resp.status_code == 200
