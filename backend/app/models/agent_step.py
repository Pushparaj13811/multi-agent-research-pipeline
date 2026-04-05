from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin


class AgentStep(Base, UUIDMixin):
    __tablename__ = "agent_steps"

    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    agent = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    input_data = Column(JSONB, nullable=True)
    output_data = Column(JSONB, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)

    run = relationship("Run", back_populates="agent_steps")
    metrics = relationship("StepMetrics", back_populates="step", uselist=False, cascade="all, delete-orphan")
