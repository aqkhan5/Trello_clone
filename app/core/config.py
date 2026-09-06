from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Trello Clone Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
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
