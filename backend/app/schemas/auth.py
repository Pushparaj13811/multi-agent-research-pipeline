from uuid import UUID
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class StoredKeyResponse(BaseModel):
    id: UUID
    provider: str
    label: str | None
    created_at: str

    model_config = {"from_attributes": True}


class StoreKeyRequest(BaseModel):
    provider: str = Field(..., pattern="^(openai|anthropic|bedrock)$")
    api_key: str = Field(..., min_length=1)
    label: str | None = None


class StoreKeyListResponse(BaseModel):
    keys: list[StoredKeyResponse]
