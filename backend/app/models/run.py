from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin


class Run(Base, UUIDMixin):
    __tablename__ = "runs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    query = Column(Text, nullable=False)
    mode = Column(String(20), nullable=False)
    llm_provider = Column(String(20), nullable=False)  # openai, anthropic, bedrock
    status = Column(String(20), nullable=False, default="pending")
    plan = Column(JSONB, nullable=True)
    report = Column(JSONB, nullable=True)
    report_markdown = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)

    user = relationship("User", back_populates="runs")
    agent_steps = relationship("AgentStep", back_populates="run", cascade="all, delete-orphan")
    search_results = relationship("SearchResult", back_populates="run", cascade="all, delete-orphan")
    extracted_contents = relationship("ExtractedContent", back_populates="run", cascade="all, delete-orphan")
