from sqlalchemy import Column, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDMixin


class User(Base, UUIDMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    api_keys = relationship("UserAPIKey", back_populates="user", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="user", cascade="all, delete-orphan")
