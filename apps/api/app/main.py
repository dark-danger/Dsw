import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth, users, tasks, events, announcements, queries,
    forms, feedback, leaderboard_student, leaderboard_staff,
    dashboard, notifications, uploads, duty_charts, committees
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack portal for Dean of Student Welfare (DSW) Geeta University",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount all domain routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(events.router)
app.include_router(announcements.router)
app.include_router(queries.router)
app.include_router(forms.router)
app.include_router(feedback.router)
app.include_router(leaderboard_student.router)
app.include_router(leaderboard_staff.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(uploads.router)
app.include_router(duty_charts.router)
app.include_router(committees.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "DSW Geeta University Portal API",
        "docs": "/docs"
    }

# Vercel ASGI Handler Export
handler = app
