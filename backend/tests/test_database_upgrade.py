import pytest
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import create_async_engine

from app import database


@pytest.mark.asyncio
async def test_legacy_sqlite_upgrade_preserves_data(tmp_path, monkeypatch):
    engine = create_async_engine(f"sqlite+aiosqlite:///{(tmp_path / 'legacy.db').as_posix()}")
    monkeypatch.setattr(database, "engine", engine)
    try:
        async with engine.begin() as conn:
            await conn.exec_driver_sql(
                "CREATE TABLE diagrams (id VARCHAR(255) PRIMARY KEY, name TEXT, "
                "type TEXT, owner_id TEXT, data TEXT, created_at DATETIME, updated_at DATETIME)"
            )
            await conn.exec_driver_sql(
                "INSERT INTO diagrams (id, name, data) VALUES ('existing', 'Keep me', '{\"nodes\":[]}')"
            )
        await database.create_all_tables()
        await database.create_all_tables()
        async with engine.connect() as conn:
            row = (await conn.exec_driver_sql("SELECT name, data, project_id FROM diagrams WHERE id='existing'")).one()
            assert tuple(row) == ('Keep me', '{"nodes":[]}', None)
            indexes = await conn.run_sync(lambda sync: inspect(sync).get_indexes("diagrams"))
            assert any(index["name"] == "ix_diagrams_project_id" for index in indexes)
    finally:
        await engine.dispose()
