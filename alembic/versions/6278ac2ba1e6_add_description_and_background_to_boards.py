"""add_description_and_background_to_boards

Revision ID: 6278ac2ba1e6
Revises: c7a1f2e8d3b4
Create Date: 2026-09-18 09:45:15.000885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6278ac2ba1e6'
down_revision: Union[str, Sequence[str], None] = 'c7a1f2e8d3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('boards', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('boards', sa.Column('background', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('boards', 'background')
    op.drop_column('boards', 'description')
