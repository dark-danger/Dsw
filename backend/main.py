import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from backend.config import settings
from backend.core.security import get_password_hash
from backend.database import AsyncSessionLocal, Base, engine
from backend.models.all_models import (
    Announcement,
    AnnouncementAudience,
    DynamicForm,
    Event,
    EventStatus,
    FacultyPerformanceLedger,
    FeedbackForm,
    FeedbackQuestion,
    LeaderboardTask,
    QueryItem,
    QueryStatus,
    StudentPointsLedger,
    SubmissionMode,
    Task,
    TaskPriority,
    TaskStatus,
    User,
    UserRole,
)
from backend.routers import (
    announcements,
    auth,
    committees,
    dashboard,
    duty_charts,
    events,
    feedback,
    forms,
    leaderboard_staff,
    leaderboard_student,
    notifications,
    queries,
    tasks,
    uploads,
    users,
)


# ── Auto-seed demo accounts on cold start ───────────────────────────────────────
async def auto_seed_if_empty() -> None:
    """Upsert the three demo accounts so the DB is never empty."""
    try:
        async with AsyncSessionLocal() as session:
            demo_accounts = [
                {
                    "email": "admin@geeta.edu.in",
                    "name": "Dr. Rajesh Sharma (Dean)",
                    "phone": "+91 98765 43210",
                    "role": UserRole.super_admin,
                    "password": "admin123",
                    "extra": {},
                },
                {
                    "email": "faculty@geeta.edu.in",
                    "name": "Prof. Amit Kumar",
                    "phone": "+91 98123 45678",
                    "role": UserRole.faculty,
                    "password": "faculty123",
                    "extra": {
                        "department": "Computer Science & Engineering",
                        "designation": "Associate Professor",
                        "employee_id": "GU-CSE-042",
                    },
                },
                {
                    "email": "student@geeta.edu.in",
                    "name": "Riya Sharma",
                    "phone": "+91 99887 76655",
                    "role": UserRole.student,
                    "password": "student123",
                    "extra": {
                        "roll_number": "GU2026001",
                        "course_branch": "B.Tech CSE",
                        "year": "3rd Year",
                    },
                },
            ]

            for acc in demo_accounts:
                res = await session.execute(
                    select(User).where(User.email == acc["email"])
                )
                user = res.scalar_one_or_none()
                hashed = get_password_hash(acc["password"])
                if not user:
                    user = User(
                        name=acc["name"],
                        email=acc["email"],
                        phone=acc["phone"],
                        role=acc["role"],
                        password_hash=hashed,
                        must_change_password=False,
                        **acc["extra"],
                    )
                    session.add(user)
                else:
                    user.password_hash = hashed

            await session.commit()
            print("✅ Auto-seeded & synchronized demo accounts successfully!")
    except Exception as exc:  # noqa: BLE001
        print(f"⚠️  Auto-seed warning: {exc}")


# ── Application lifespan ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ANN001
    # Create all tables on startup (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await auto_seed_if_empty()
    yield


# ── FastAPI app ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack portal for Dean of Student Welfare (DSW) — Geeta University",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────────
# allow_credentials must be False when allow_origins contains "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    print(f"Global Exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error_type": type(exc).__name__},
        headers={"Access-Control-Allow-Origin": "*"},
    )


# ── Routers ─────────────────────────────────────────────────────────────────────
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


# ── Health-check ────────────────────────────────────────────────────────────────
@app.get("/api")
@app.get("/api/")
async def root() -> dict:
    return {
        "status": "online",
        "service": "DSW Geeta University Portal API",
        "docs": "/api/docs",
    }


# ── Vercel ASGI export ──────────────────────────────────────────────────────────
# Vercel's @vercel/python runtime looks for a top-level `app` or `handler` name.
handler = app
