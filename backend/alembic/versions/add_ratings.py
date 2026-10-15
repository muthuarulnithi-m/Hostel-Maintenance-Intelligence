"""add complaint ratings

Revision ID: add_ratings
Revises: 88673ac4960f
Create Date: 2026-09-29
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_ratings"

down_revision: Union[str, Sequence[str], None] = "88673ac4960f"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ratings",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "complaint_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "staff_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "rating",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "feedback",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_rating_value",
        ),
        sa.ForeignKeyConstraint(
            ["complaint_id"],
            ["complaints.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["staff_id"],
            ["staff_profiles.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "complaint_id",
            name="uq_rating_complaint",
        ),
    )

    op.create_index(
        op.f("ix_ratings_id"),
        "ratings",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_ratings_complaint_id"),
        "ratings",
        ["complaint_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_ratings_student_id"),
        "ratings",
        ["student_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_ratings_staff_id"),
        "ratings",
        ["staff_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_ratings_staff_id"),
        table_name="ratings",
    )

    op.drop_index(
        op.f("ix_ratings_student_id"),
        table_name="ratings",
    )

    op.drop_index(
        op.f("ix_ratings_complaint_id"),
        table_name="ratings",
    )

    op.drop_index(
        op.f("ix_ratings_id"),
        table_name="ratings",
    )

    op.drop_table("ratings")