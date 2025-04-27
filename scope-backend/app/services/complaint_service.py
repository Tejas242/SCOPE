from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.domain.complaint import Complaint
from app.models.schemas.complaint import ComplaintCreate, ComplaintUpdate
from app.ml.model import get_model_predictor


class ComplaintService:
    @staticmethod
    async def create_complaint(db: Session, complaint: ComplaintCreate) -> Complaint:
        try:
            # Get predictions from ML model
            model_predictor = get_model_predictor()
            prediction = model_predictor.predict(complaint.complaint_text)
            
            # Create new complaint with predicted categories
            db_complaint = Complaint(
                complaint_text=complaint.complaint_text,
                category=prediction["category"],
                urgency=prediction["urgency"],
                status="Pending"
            )
        except Exception as e:
            print(f"Warning: Failed to use ML model for prediction: {e}")
            # Default to medium priority and "Other" category if model fails
            db_complaint = Complaint(
                complaint_text=complaint.complaint_text,
                category="Other",
                urgency="Medium",
                status="Pending"
            )
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        return db_complaint
    
    @staticmethod
    async def get_complaint(db: Session, complaint_id: int) -> Optional[Complaint]:
        return db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    @staticmethod
    async def get_complaints(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        urgency: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Complaint]:
        query = db.query(Complaint)
        
        # Apply filters if provided
        if category:
            query = query.filter(Complaint.category == category)
        if urgency:
            query = query.filter(Complaint.urgency == urgency)
        if status:
            query = query.filter(Complaint.status == status)
        if search:
            query = query.filter(Complaint.complaint_text.ilike(f"%{search}%"))
        
        # Sort by created_at in descending order (newest first)
        query = query.order_by(Complaint.created_at.desc())
            
        # Apply pagination
        return query.offset(skip).limit(limit).all()
        
    @staticmethod
    async def get_complaints_count(
        db: Session,
        category: Optional[str] = None,
        urgency: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> int:
        """Get the total count of complaints with the applied filters."""
        query = db.query(Complaint)
        
        # Apply filters if provided
        if category:
            query = query.filter(Complaint.category == category)
        if urgency:
            query = query.filter(Complaint.urgency == urgency)
        if status:
            query = query.filter(Complaint.status == status)
        if search:
            query = query.filter(Complaint.complaint_text.ilike(f"%{search}%"))
            
        return query.count()
    
    @staticmethod
    async def update_complaint(db: Session, complaint_id: int, complaint_update: ComplaintUpdate) -> Optional[Complaint]:
        db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if db_complaint:
            update_data = complaint_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_complaint, key, value)
            db.commit()
            db.refresh(db_complaint)
        return db_complaint
    
    @staticmethod
    async def delete_complaint(db: Session, complaint_id: int) -> bool:
        db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if db_complaint:
            db.delete(db_complaint)
            db.commit()
            return True
        return False
