from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from app.api.routes import api_router
from app.core.config import settings
from app.db.database import Base, engine, get_db
from app.models.domain.user import User, UserRole
from app.core.security import get_password_hash

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Create initial admin user if none exists
@app.on_event("startup")
async def create_initial_users():
    db = next(get_db())
    
    # Check if any users exist
    user_count = db.query(User).count()
    if user_count == 0:
        # Create admin user
        admin_user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),  # Change in production
            full_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        
        # Create staff user
        staff_user = User(
            email="staff@example.com",
            hashed_password=get_password_hash("staffpassword"),  # Change in production
            full_name="Staff User",
            role=UserRole.STAFF,
            is_active=True
        )
        db.add(staff_user)
        
        # Create student user
        student_user = User(
            email="student@example.com",
            hashed_password=get_password_hash("studentpassword"),  # Change in production
            full_name="Student User",
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student_user)
        
        db.commit()


@app.get("/")
def read_root():
    return {
        "message": "Welcome to SCOPE API",
        "documentation": "/docs",
    }
