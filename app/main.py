# app/main.py (or app/api/v1/__init__.py)
from fastapi import FastAPI
from app.api.v1.auth import router as auth_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(auth_router, prefix=settings.API_V1_STR)