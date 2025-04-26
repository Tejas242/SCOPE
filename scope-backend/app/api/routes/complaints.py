from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies.auth import get_current_user, get_current_staff_user
from app.services.complaint_service import ComplaintService
from app.models.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintUpdate,
    ComplaintPrediction
)
from app.ml.model import get_model_predictor

router = APIRouter()


@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    return await ComplaintService.create_complaint(db=db, complaint=complaint)


@router.get("/", response_model=List[ComplaintResponse])
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Any:
    complaints = await ComplaintService.get_complaints(db, skip=skip, limit=limit)
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def read_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    complaint = await ComplaintService.get_complaint(db, complaint_id=complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: int,
    complaint_update: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> Any:
    complaint = await ComplaintService.update_complaint(
        db=db, complaint_id=complaint_id, complaint_update=complaint_update
    )
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_user)
) -> None:
    success = await ComplaintService.delete_complaint(db=db, complaint_id=complaint_id)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint not found")


@router.post("/classify", response_model=ComplaintPrediction)
async def classify_complaint_text(
    complaint: ComplaintCreate,
    current_user = Depends(get_current_user)
) -> Any:
    model_predictor = get_model_predictor()
    prediction = model_predictor.predict(complaint.complaint_text)
    return prediction
