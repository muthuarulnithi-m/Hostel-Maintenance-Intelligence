from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.config import settings
from app.core.database import Base

# Import every model so Alembic can detect them.
from app.models.user import User
from app.models.hostel import Hostel
from app.models.block import Block
from app.models.room import Room
from app.models.student_assignment import StudentRoomAssignment
from app.models.staff import StaffProfile
from app.models.staff_skill import StaffSkill
from app.models.rating import Rating

config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def get_database_url():
    return settings.DATABASE_URL


def run_migrations_offline() -> None:

    url = get_database_url()

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:

    configuration = config.get_section(
        config.config_ini_section,
    )

    configuration["sqlalchemy.url"] = get_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()
    