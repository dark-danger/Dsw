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
            result = await session.execute(select(User).limit(1))
            existing_user = result.scalar_one_or_none()
            if not existing_user:
                # 1. Super Admin
                admin = User(
                    name="Dr. Rajesh Sharma (Dean)",
                    email="admin@geeta.edu.in",
                    phone="+91 98765 43210",
                    role=UserRole.super_admin,
                    password_hash=get_password_hash("admin123"),
                    must_change_password=False
                )
                session.add(admin)

                # 2. Faculty Members
                fac1 = User(
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
                fac2 = User(
                    name="Dr. Sneha Verma",
                    email="sneha.verma@geeta.edu.in",
                    phone="+91 97123 88990",
                    department="Management & Commerce",
                    designation="Assistant Professor",
                    employee_id="GU-MGT-019",
                    role=UserRole.faculty,
                    password_hash=get_password_hash("faculty123"),
                    must_change_password=False
                )
                session.add_all([fac1, fac2])

                # 3. Student Members
                stu1 = User(
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
                session.add(stu1)
                await session.commit()
                print("Auto-seeded initial database accounts successfully!")
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
