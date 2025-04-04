"""Agregar is_admin a usuarios

Revision ID: ac88266983a4
Revises: 8d2ea69f5d0d
Create Date: 2025-03-15 12:42:03.357999

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac88266983a4'
down_revision: Union[str, None] = '8d2ea69f5d0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('usuarios', sa.Column('is_admin', sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('usuarios', 'is_admin')
    # ### end Alembic commands ###
