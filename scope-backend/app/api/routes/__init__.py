from fastapi import APIRouter

from app.api.routes import auth, complaints, users, chatbot, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
