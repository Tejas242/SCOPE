from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies.auth import get_current_staff_user
from app.services.eda_service import EdaService

router = APIRouter()


@router.get("/basic-stats")
async def get_basic_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Dict[str, Any]:
    """
    Get basic statistics about complaints for the EDA dashboard.
    """
    return EdaService.get_basic_stats(db)


@router.get("/time-trends")
async def get_time_trends(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Dict[str, Any]:
    """
    Get time series data for visualizing complaint trends.
    """
    return EdaService.get_time_trends(db)


@router.get("/category-relationships")
async def get_category_relationships(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Dict[str, Any]:
    """
    Get cross-tabulations between categories, urgency levels, and statuses.
    """
    return EdaService.get_category_relationships(db)


@router.get("/word-frequency")
async def get_word_frequency(
    limit: int = Query(30, description="Number of most common words to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> List[Dict[str, Any]]:
    """
    Get the most frequent words from complaint texts.
    """
    return EdaService.get_word_frequency(db, limit)


@router.get("/cluster")
async def cluster_complaints(
    n_clusters: int = Query(5, description="Number of clusters to create"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Dict[str, Any]:
    """
    Cluster complaints based on their content using NLP techniques.
    """
    return EdaService.cluster_complaints(db, n_clusters)


@router.get("/topics")
async def get_topics(
    n_topics: int = Query(5, description="Number of topics to extract"),
    n_words: int = Query(10, description="Number of top words per topic"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Dict[str, Any]:
    """
    Extract topics from complaint texts using Latent Dirichlet Allocation (LDA).
    Returns topics with their most representative words and complaints.
    """
    return EdaService.get_topics(db, n_topics, n_words)
