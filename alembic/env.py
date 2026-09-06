# alembic/env.py
import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Ensure the application root directory is on sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.base import Base
import app.models  # noqa: F401 - registers all 16 models to Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# In alembic/env.py where raw_url is processed:
raw_url = str(settings.DATABASE_URL)

# Normalize protocol
if raw_url.startswith("postgres://"):
    db_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
    db_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    db_url = raw_url

# Strip libpq-only parameters incompatible with asyncpg
db_url = db_url.replace("sslmode=require", "ssl=require")
db_url = db_url.replace("&channel_binding=require", "").replace("channel_binding=require&", "").replace("?channel_binding=require", "")

config.set_main_option("sqlalchemy.url", db_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Synchronous callback executed inside connection.run_sync."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations asynchronously using AsyncEngine and asyncpg."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()