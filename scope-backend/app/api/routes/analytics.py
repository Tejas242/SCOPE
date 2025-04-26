from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies.auth import get_current_staff_user
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/trends")
async def get_complaint_trends(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Any:
    """
    Get complaint trends and statistics.
    
    This endpoint returns distribution of complaints by category, urgency, and status.
    """
    return AnalyticsService.get_complaint_trends(db)


@router.get("/priority")
async def get_priority_complaints(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Any:
    """
    Get the highest priority complaints that need attention.
    """
    complaints = AnalyticsService.get_highest_priority_complaints(db, limit)
    return [
        {
            "id": c.id,
            "text": c.complaint_text,
            "category": c.category,
            "urgency": c.urgency,
            "status": c.status
        }
        for c in complaints
    ]


@router.get("/topics")
async def get_common_topics(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Any:
    """
    Get the most common topics from complaint texts.
    """
    topics = AnalyticsService.get_common_topics(db, limit)
    return [{"topic": topic, "count": count} for topic, count in topics]


@router.get("/response-times")
async def get_response_times(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Any:
    """
    Get statistics on complaint response times.
    """
    return AnalyticsService.get_response_time_stats(db)
