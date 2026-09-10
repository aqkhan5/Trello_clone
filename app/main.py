# app/main.py
from fastapi import FastAPI
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.invitations import router as invitations_router
from app.api.v1.boards import router as boards_router
from app.api.v1.lists import router as lists_router
from app.api.v1.cards import router as cards_router
from app.api.v1.labels import router as labels_router
from app.api.v1.checklists import router as checklists_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(workspaces_router, prefix=settings.API_V1_STR)
app.include_router(invitations_router, prefix=settings.API_V1_STR)
app.include_router(boards_router, prefix=settings.API_V1_STR)
app.include_router(lists_router, prefix=settings.API_V1_STR)
app.include_router(cards_router, prefix=settings.API_V1_STR)
app.include_router(labels_router, prefix=settings.API_V1_STR)
app.include_router(checklists_router, prefix=settings.API_V1_STR)