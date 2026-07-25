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

from sqlalchemy import select
from app.models.all_models import (
    User, UserRole, Event, EventStatus, Task, TaskStatus, TaskPriority,
    Announcement, AnnouncementAudience, QueryItem, QueryStatus,
    DynamicForm, FeedbackForm, FeedbackQuestion, LeaderboardTask, SubmissionMode,
    StudentPointsLedger, FacultyPerformanceLedger
)
from app.core.security import get_password_hash
from app.database import engine, Base, AsyncSessionLocal

async def auto_seed_if_empty():
    try:
        async with AsyncSessionLocal() as session:
            # 1. Ensure Super Admin
            res_admin = await session.execute(select(User).where(User.email == "admin@geeta.edu.in"))
            admin = res_admin.scalar_one_or_none()
            if not admin:
                admin = User(
                    name="Dr. Rajesh Sharma (Dean)",
                    email="admin@geeta.edu.in",
                    phone="+91 98765 43210",
                    role=UserRole.super_admin,
                    password_hash=get_password_hash("admin123"),
                    must_change_password=False
                )
                session.add(admin)
            else:
                admin.password_hash = get_password_hash("admin123")

            # 2. Ensure Faculty
            res_fac = await session.execute(select(User).where(User.email == "faculty@geeta.edu.in"))
            fac = res_fac.scalar_one_or_none()
            if not fac:
                fac = User(
                    name="Prof. Amit Kumar",
                    email="faculty@geeta.edu.in",
                    phone="+91 98123 45678",
                    department="Computer Science & Engineering",
                    designation="Associate Professor",
                    employee_id="GU-CSE-042",
                    role=UserRole.faculty,
                    password_hash=get_password_hash("faculty123"),
                    must_change_password=False
                )
                session.add(fac)
            else:
                fac.password_hash = get_password_hash("faculty123")

            # 3. Ensure Student
            res_stu = await session.execute(select(User).where(User.email == "student@geeta.edu.in"))
            stu = res_stu.scalar_one_or_none()
            if not stu:
                stu = User(
                    name="Riya Sharma",
                    email="student@geeta.edu.in",
                    phone="+91 99887 76655",
                    roll_number="GU2026001",
                    course_branch="B.Tech CSE",
                    year="3rd Year",
                    role=UserRole.student,
                    password_hash=get_password_hash("student123"),
                    must_change_password=False
                )
                session.add(stu)
            else:
                stu.password_hash = get_password_hash("student123")

            await session.commit()
            print("Auto-seeded & synchronized demo accounts successfully!")
    except Exception as e:
        print(f"Auto-seed warning: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await auto_seed_if_empty()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack portal for Dean of Student Welfare (DSW) Geeta University",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local dev and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_origin_regex="https://.*",
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
