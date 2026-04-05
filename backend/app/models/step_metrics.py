from sqlalchemy import Column, String, Integer, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin


class StepMetrics(Base, UUIDMixin):
    __tablename__ = "step_metrics"

    step_id = Column(UUID(as_uuid=True), ForeignKey("agent_steps.id"), nullable=False)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    cost_usd = Column(Numeric(10, 6), nullable=True)
    model_name = Column(String(50), nullable=True)
    tool_calls = Column(Integer, default=0)
    tool_names = Column(ARRAY(Text), nullable=True)
    langsmith_url = Column(Text, nullable=True)

    step = relationship("AgentStep", back_populates="metrics")
