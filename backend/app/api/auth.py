import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.encryption import encrypt_api_key, decrypt_api_key
from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.database import get_db
from app.middleware.rate_limit import limiter
from app.models import User, UserAPIKey
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    StoreKeyRequest,
    StoredKeyResponse,
    StoreKeyListResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.email)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id), user.email)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


# --- API Key Management (encrypted storage) ---

@router.post("/keys", response_model=StoredKeyResponse, status_code=status.HTTP_201_CREATED)
async def store_api_key(
    body: StoreKeyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Delete existing key for this provider (one key per provider per user)
    existing = await db.execute(
        select(UserAPIKey).where(UserAPIKey.user_id == user.id, UserAPIKey.provider == body.provider)
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)

    encrypted = encrypt_api_key(body.api_key)
    key = UserAPIKey(
        id=uuid.uuid4(),
        user_id=user.id,
        provider=body.provider,
        encrypted_key=encrypted,
        label=body.label,
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)

    return StoredKeyResponse(
        id=key.id,
        provider=key.provider,
        label=key.label,
        created_at=str(key.created_at),
    )


@router.get("/keys", response_model=StoreKeyListResponse)
async def list_api_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserAPIKey).where(UserAPIKey.user_id == user.id).order_by(UserAPIKey.provider)
    )
    keys = result.scalars().all()
    return StoreKeyListResponse(
        keys=[
            StoredKeyResponse(id=k.id, provider=k.provider, label=k.label, created_at=str(k.created_at))
            for k in keys
        ]
    )


@router.delete("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserAPIKey).where(UserAPIKey.id == key_id, UserAPIKey.user_id == user.id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    await db.delete(key)
    await db.commit()
