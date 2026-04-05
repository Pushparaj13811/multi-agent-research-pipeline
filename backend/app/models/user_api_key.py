from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin


class UserAPIKey(Base, UUIDMixin):
    __tablename__ = "user_api_keys"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider = Column(String(20), nullable=False)  # openai, anthropic, bedrock
    encrypted_key = Column(Text, nullable=False)  # Fernet-encrypted API key
    label = Column(String(100), nullable=True)  # user-friendly label
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="api_keys")
