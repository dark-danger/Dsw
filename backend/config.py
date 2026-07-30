import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "DSW Geeta University Portal API"
    ENV: str = "development"

    # ── Database ────────────────────────────────────────────────────────────────
    # On Vercel set DATABASE_URL in the project's Environment Variables dashboard.
    # Falls back to a local SQLite file for `npm run dev` convenience.
    DATABASE_URL: str = (
        f"sqlite+aiosqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dsw_portal.db'))}"
    )

    # ── JWT ─────────────────────────────────────────────────────────────────────
    JWT_SECRET: str = "geeta-university-dsw-super-secret-key-2026"
    JWT_REFRESH_SECRET: str = "geeta-university-dsw-refresh-secret-key-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24   # 24 h
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ────────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "*",
    ]

    # ── File uploads ────────────────────────────────────────────────────────────
    # Vercel serverless only allows writes to /tmp.
    # For persistent storage point UPLOAD_DIR to a mounted volume / object store.
    UPLOAD_DIR: str = "/tmp/dsw_uploads"

    # ── Optional external integrations ──────────────────────────────────────────
    GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: Optional[str] = None
    BLOB_READ_WRITE_TOKEN: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure upload directory exists (uses /tmp on Vercel, local path in dev)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
