"""add notification event keys for retry-safe inserts

Revision ID: 3b4a7e1c9d20
Revises: bd845ef8451f
Create Date: 2026-10-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3b4a7e1c9d20"
down_revision: Union[str, Sequence[str], None] = "bd845ef8451f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("event_key", sa.String(length=200), nullable=True),
    )
    op.create_index(
        "ix_notifications_event_key",
        "notifications",
        ["event_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_event_key", table_name="notifications")
    op.drop_column("notifications", "event_key")
