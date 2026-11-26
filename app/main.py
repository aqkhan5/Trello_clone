from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.api.v1.activity_logs import router as activity_router
from app.api.v1.attachments import router as attachments_router
from app.api.v1.auth import router as auth_router
from app.api.v1.boards import router as boards_router
from app.api.v1.cards import router as cards_router
from app.api.v1.checklists import router as checklists_router
from app.api.v1.comments import router as comments_router
from app.api.v1.invitations import router as invitations_router
from app.api.v1.labels import router as labels_router
from app.api.v1.lists import router as lists_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.websockets import router as ws_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

import os

raw_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
extra_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
if extra_origins:
    raw_origins.extend(extra_origins.split(","))
origins = list(dict.fromkeys(o.strip().rstrip("/") for o in raw_origins if o and o.strip()))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.staticfiles import StaticFiles

UPLOAD_DIR = (
    os.path.abspath(settings.UPLOAD_DIR)
    if settings.UPLOAD_DIR
    else os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
)
os.makedirs(os.path.join(UPLOAD_DIR, "attachments"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(workspaces_router, prefix=settings.API_V1_STR)
app.include_router(invitations_router, prefix=settings.API_V1_STR)
app.include_router(boards_router, prefix=settings.API_V1_STR)
app.include_router(lists_router, prefix=settings.API_V1_STR)
app.include_router(cards_router, prefix=settings.API_V1_STR)
app.include_router(labels_router, prefix=settings.API_V1_STR)
app.include_router(checklists_router, prefix=settings.API_V1_STR)
app.include_router(comments_router, prefix=settings.API_V1_STR)
app.include_router(attachments_router, prefix=settings.API_V1_STR)
app.include_router(activity_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
)
FRONTEND_INDEX = os.path.join(FRONTEND_DIST_DIR, "index.html")

if os.path.isfile(FRONTEND_INDEX):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    async def serve_spa_root() -> FileResponse:
        return FileResponse(FRONTEND_INDEX)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_fallback(full_path: str) -> FileResponse:
        if (
            full_path == "api"
            or full_path.startswith("api/")
            or full_path == "uploads"
            or full_path.startswith("uploads/")
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        candidate = os.path.abspath(os.path.join(FRONTEND_DIST_DIR, full_path))
        if (
            os.path.commonpath([FRONTEND_DIST_DIR, candidate]) == FRONTEND_DIST_DIR
            and os.path.isfile(candidate)
        ):
            return FileResponse(candidate)

        return FileResponse(FRONTEND_INDEX)
else:

    @app.get("/", tags=["Health"])
    async def root() -> dict[str, str]:
        return {"status": "ok", "service": settings.PROJECT_NAME}