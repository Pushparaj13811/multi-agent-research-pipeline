from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin


class ExtractedContent(Base, UUIDMixin):
    __tablename__ = "extracted_content"

    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    search_result_id = Column(UUID(as_uuid=True), ForeignKey("search_results.id"), nullable=True)
    url = Column(Text, nullable=False)
    extraction_method = Column(String(20), nullable=True)
    raw_content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    key_findings = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    run = relationship("Run", back_populates="extracted_contents")
