# app/core/config.py
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Trello Clone Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str

    # Security / JWT configuration
    SECRET_KEY: str = "supersecretkey_change_in_production_run_openssl_rand_hex_32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Strip libpq-only parameters incompatible with asyncpg
        v = v.replace("sslmode=require", "ssl=require")
        v = (
            v.replace("&channel_binding=require", "")
            .replace("channel_binding=require&", "")
            .replace("?channel_binding=require", "")
        )
        return v


settings = Settings()