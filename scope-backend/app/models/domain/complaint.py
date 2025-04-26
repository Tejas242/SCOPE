from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class Category(str, enum.Enum):
    ACADEMIC = "Academic"
    FACILITIES = "Facilities"
    HOUSING = "Housing"
    IT_SUPPORT = "IT Support"
    FINANCIAL_AID = "Financial Aid"
    CAMPUS_LIFE = "Campus Life"
    OTHER = "Other"


class Urgency(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_text = Column(Text, nullable=False)
    category = Column(Enum(Category), nullable=True)
    urgency = Column(Enum(Urgency), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    status = Column(String, default="Pending")
    assigned_to = Column(String, nullable=True)
    response = Column(Text, nullable=True)
