from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.domain.complaint import Category, Urgency


class ComplaintBase(BaseModel):
    complaint_text: str = Field(..., min_length=10)


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintUpdate(BaseModel):
    complaint_text: Optional[str] = None
    category: Optional[Category] = None
    urgency: Optional[Urgency] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    response: Optional[str] = None


class ComplaintInDB(ComplaintBase):
    id: int
    category: Optional[Category] = None
    urgency: Optional[Urgency] = None
    created_at: datetime
    updated_at: datetime
    status: str
    assigned_to: Optional[str] = None
    response: Optional[str] = None

    class Config:
        from_attributes = True


class ComplaintResponse(ComplaintInDB):
    pass


class ComplaintPrediction(BaseModel):
    category: Category
    urgency: Urgency
    confidence_category: float
    confidence_urgency: float

class PaginatedComplaintsResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int