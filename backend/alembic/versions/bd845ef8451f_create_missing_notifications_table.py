"""create missing notifications table

Revision ID: bd845ef8451f
Revises: add_ratings
Create Date: 2026-09-29
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "bd845ef8451f"
down_revision: Union[str, Sequence[str], None] = "add_ratings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notifications",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "title",
            sa.String(length=200),
            nullable=False,
        ),

        sa.Column(
            "message",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "notification_type",
            sa.String(length=50),
            nullable=False,
        ),

        sa.Column(
            "complaint_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "alert_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),

        sa.Column(
            "read_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["complaint_id"],
            ["complaints.id"],
            ondelete="SET NULL",
        ),

        sa.ForeignKeyConstraint(
            ["alert_id"],
            ["complaint_alerts.id"],
            ondelete="SET NULL",
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_notifications_id"),
        "notifications",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_notifications_user_id"),
        "notifications",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_notifications_notification_type"),
        "notifications",
        ["notification_type"],
        unique=False,
    )

    op.create_index(
        op.f("ix_notifications_complaint_id"),
        "notifications",
        ["complaint_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_notifications_alert_id"),
        "notifications",
        ["alert_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_notifications_created_at"),
        "notifications",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_notifications_created_at"),
        table_name="notifications",
    )

    op.drop_index(
        op.f("ix_notifications_alert_id"),
        table_name="notifications",
    )

    op.drop_index(
        op.f("ix_notifications_complaint_id"),
        table_name="notifications",
    )

    op.drop_index(
        op.f("ix_notifications_notification_type"),
        table_name="notifications",
    )

    op.drop_index(
        op.f("ix_notifications_user_id"),
        table_name="notifications",
    )

    op.drop_index(
        op.f("ix_notifications_id"),
        table_name="notifications",
    )

    op.drop_table("notifications")