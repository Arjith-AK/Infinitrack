import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, missions, jobs, reports, robot, users
from app.websocket.robot_ws import router as ws_router

app = FastAPI(
    title="InfiniTrack API",
    description="AI Powered Sports Field Marking Robot Backend",
    version="1.0.0",
)

# Comma-separated list of extra allowed origins, e.g. a custom domain in
# front of the Netlify deploy. The Netlify URL and local dev are always
# allowed so the deployed frontend keeps working without extra config.
_extra_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://infinitrack.netlify.app",
        "http://localhost:5173",
        *_extra_origins,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(missions.router, prefix="/api/v1/missions", tags=["Missions"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(robot.router, prefix="/api/v1/robot", tags=["Robot"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(ws_router, tags=["WebSocket"])


@app.get("/")
async def root():
    return {"name": "InfiniTrack API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Serve the built frontend (frontend/npm run build -> frontend/dist) from
# this same server, so the whole app lives at ONE url/origin. This matters
# in the field: the browser's login state (localStorage) is scoped per
# origin, so if you logged in via a different address than the one you use
# later, it won't remember you. Registered last so it never shadows the
# API/WebSocket routes above.
# ---------------------------------------------------------------------------
_FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if _FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        requested = _FRONTEND_DIST / full_path
        if full_path and requested.is_file():
            return FileResponse(requested)
        # Anything else -- including client-side routes like /gps or /drive
        # -- falls through to index.html so React Router can handle it.
        return FileResponse(_FRONTEND_DIST / "index.html")
