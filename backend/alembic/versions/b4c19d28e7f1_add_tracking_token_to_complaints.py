"""add_tracking_token_to_complaints

Revision ID: b4c19d28e7f1
Revises: 2a9dad9c139f
Create Date: 2026-10-25 18:58:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b4c19d28e7f1'
down_revision: Union[str, None] = '2a9dad9c139f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'complaints' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('complaints')]
        if 'tracking_token' not in columns:
            op.add_column('complaints', sa.Column('tracking_token', sa.String(length=64), nullable=True))
            try:
                op.create_index(op.f('ix_complaints_tracking_token'), 'complaints', ['tracking_token'], unique=False)
            except Exception:
                pass


def downgrade() -> None:
    try:
        op.drop_index(op.f('ix_complaints_tracking_token'), table_name='complaints')
    except Exception:
        pass
    op.drop_column('complaints', 'tracking_token')
