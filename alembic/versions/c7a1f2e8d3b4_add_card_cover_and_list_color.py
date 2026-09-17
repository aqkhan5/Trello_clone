"""Add cover_color and cover_image to cards, and color to lists

Revision ID: c7a1f2e8d3b4
Revises: 96f87cf59ec5
Create Date: 2026-09-17 21:24:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7a1f2e8d3b4'
down_revision: Union[str, Sequence[str], None] = '96f87cf59ec5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('cards', sa.Column('cover_color', sa.String(length=50), nullable=True))
    op.add_column('cards', sa.Column('cover_image', sa.String(length=500), nullable=True))
    op.add_column('lists', sa.Column('color', sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('lists', 'color')
    op.drop_column('cards', 'cover_image')
    op.drop_column('cards', 'cover_color')
