from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin


class SearchResult(Base, UUIDMixin):
    __tablename__ = "search_results"

    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    source = Column(String(20), nullable=False)
    query = Column(Text, nullable=False)
    url = Column(Text, nullable=True)
    title = Column(Text, nullable=True)
    snippet = Column(Text, nullable=True)
    relevance_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    run = relationship("Run", back_populates="search_results")
