from langchain.tools import BaseTool
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.domain.complaint import Complaint, Category, Urgency
from app.services.complaint_service import ComplaintService
from app.models.schemas.complaint import ComplaintCreate, ComplaintUpdate


class SearchComplaintInput(BaseModel):
    query: str = Field(..., description="The search query to find complaints")


class GetComplaintInput(BaseModel):
    complaint_id: int = Field(..., description="The ID of the complaint to retrieve")


class UpdateComplaintStatusInput(BaseModel):
    complaint_id: int = Field(..., description="The ID of the complaint to update")
    status: str = Field(..., description="The new status for the complaint (Pending, In Progress, Resolved, Closed)")


class GetComplaintStatsByTypeInput(BaseModel):
    category: str = Field(..., description="The category to filter by (Academic, Facilities, Housing, IT Support, Financial Aid, Campus Life, Other)")


class SearchComplaintTool(BaseTool):
    name: str = "search_complaints" 
    description: str = "Search for complaints using keywords"
    args_schema: Type[SearchComplaintInput] = SearchComplaintInput
    
    def _run(self, query: str) -> str:
        from app.chatbot.embeddings import ComplaintEmbedding
        
        try:
            embedding_manager = ComplaintEmbedding()
            vector_store = embedding_manager.get_vector_store()
            results = vector_store.similarity_search(query, k=5)
            
            if not results:
                return "No complaints found matching your query."
            
            output = "Here are the complaints that match your query:\n\n"
            for i, doc in enumerate(results):
                output += f"Complaint #{doc.metadata['id']}: {doc.page_content[:100]}...\n"
                output += f"Category: {doc.metadata['category']}, Urgency: {doc.metadata['urgency']}, Status: {doc.metadata['status']}\n\n"
            
            return output
        except Exception as e:
            return f"Error searching complaints: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        return self._run(query)


class GetComplaintTool(BaseTool):
    name: str = "get_complaint"
    description: str = "Get details about a specific complaint by ID"
    args_schema: Type[GetComplaintInput] = GetComplaintInput
    
    def _run(self, complaint_id: int) -> str:
        db = SessionLocal()
        try:
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            if not complaint:
                return f"No complaint found with ID {complaint_id}"
            
            output = f"Complaint #{complaint.id}:\n\n"
            output += f"Text: {complaint.complaint_text}\n\n"
            output += f"Category: {complaint.category}\n"
            output += f"Urgency: {complaint.urgency}\n"
            output += f"Status: {complaint.status}\n"
            output += f"Created at: {complaint.created_at}\n"
            
            if complaint.assigned_to is not None:
                output += f"Assigned to: {complaint.assigned_to}\n"
            
            if complaint.response is not None:
                output += f"\nResponse: {complaint.response}\n"
            

            output += "\nEnd of complaint details."
            
            return output
        except Exception as e:
            return f"Error retrieving complaint: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, complaint_id: int) -> str:
        return self._run(complaint_id)


class UpdateComplaintStatusTool(BaseTool):
    name: str = "update_complaint_status"
    description: str = "Update the status of a specific complaint"
    args_schema: Type[UpdateComplaintStatusInput] = UpdateComplaintStatusInput
    
    def _run(self, complaint_id: int, status: str) -> str:
        db = SessionLocal()
        try:
            valid_statuses = ["Pending", "In Progress", "Resolved", "Closed"]
            if status not in valid_statuses:
                return f"Invalid status. Please use one of: {', '.join(valid_statuses)}"
            
            complaint_update = ComplaintUpdate(status=status)
            complaint_service = ComplaintService()
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            
            if not complaint:
                return f"No complaint found with ID {complaint_id}"
            
            setattr(complaint, "status", status)
            db.commit()
            db.refresh(complaint)
            
            return f"Status of complaint #{complaint_id} updated to {status}"
        except Exception as e:
            db.rollback()
            return f"Error updating complaint status: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, complaint_id: int, status: str) -> str:
        return self._run(complaint_id, status)


class GetComplaintStatsByTypeTool(BaseTool):
    name: str = "get_complaint_stats_by_type"
    description: str = "Get statistics about complaints by category"
    args_schema: Type[GetComplaintStatsByTypeInput] = GetComplaintStatsByTypeInput
    
    def _run(self, category: str) -> str:
        db = SessionLocal()
        try:
            valid_categories = [c.value for c in Category]
            if category not in valid_categories:
                return f"Invalid category. Please use one of: {', '.join(valid_categories)}"
            
            complaints = db.query(Complaint).filter(Complaint.category == category).all()
            
            if not complaints:
                return f"No complaints found in category {category}"
            
            status_counts = {}
            urgency_counts = {}
            
            for complaint in complaints:
                status_counts[complaint.status] = status_counts.get(complaint.status, 0) + 1
                urgency_counts[complaint.urgency] = urgency_counts.get(complaint.urgency, 0) + 1
            
            output = f"Statistics for {category} complaints:\n\n"
            output += f"Total complaints: {len(complaints)}\n\n"
            
            output += "Status breakdown:\n"
            for status, count in status_counts.items():
                output += f"- {status}: {count}\n"
            
            output += "\nUrgency breakdown:\n"
            for urgency, count in urgency_counts.items():
                output += f"- {urgency}: {count}\n"
            
            return output
        except Exception as e:
            return f"Error getting complaint statistics: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, category: str) -> str:
        return self._run(category)


def get_chatbot_tools():
    return [
        SearchComplaintTool(),
        GetComplaintTool(),
        UpdateComplaintStatusTool(),
        GetComplaintStatsByTypeTool()
    ]
