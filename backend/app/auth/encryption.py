import sys

from cryptography.fernet import Fernet

from app.config import settings

_fernet_instance: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance

    key = settings.encryption_key
    if not key:
        print(
            "CRITICAL: ENCRYPTION_KEY is not set. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"",
            file=sys.stderr,
        )
        raise RuntimeError("ENCRYPTION_KEY must be set to encrypt/decrypt API keys")

    _fernet_instance = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet_instance


def encrypt_api_key(plain_key: str) -> str:
    """Encrypt an API key for storage in the database."""
    f = _get_fernet()
    return f.encrypt(plain_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key from the database."""
    f = _get_fernet()
    return f.decrypt(encrypted_key.encode()).decode()
