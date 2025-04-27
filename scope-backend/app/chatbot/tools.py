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
            
            # Create a formatted markdown table for better UI display
            output = f"### Search Results for: '{query}'\n\n"
            output += "| ID | Preview | Category | Urgency | Status |\n"
            output += "|---|---------|----------|---------|--------|\n"
            
            for doc in enumerate(results):
                # Get a preview of the complaint text (first 60 chars)
                preview = doc[1].page_content[:60].replace("\n", " ").strip() + "..."
                
                # Format urgency with emoji indicators
                urgency_display = doc[1].metadata['urgency']
                if urgency_display == "Critical":
                    urgency_display = "🔴 Critical"
                elif urgency_display == "High":
                    urgency_display = "🟠 High"
                elif urgency_display == "Medium":
                    urgency_display = "🟡 Medium"
                elif urgency_display == "Low":
                    urgency_display = "🟢 Low"
                
                # Add the table row
                output += f"| {doc[1].metadata['id']} | {preview} | {doc[1].metadata['category']} | {urgency_display} | {doc[1].metadata['status']} |\n"
            
            output += "\n\nTo view full details of a specific complaint, ask me to 'get complaint #ID'"
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
            
            # Format urgency with emoji indicators
            urgency_display = str(complaint.urgency) if complaint.urgency is not None else "Not set"
            if urgency_display == "Critical":
                urgency_display = "🔴 Critical"
            elif urgency_display == "High":
                urgency_display = "🟠 High"
            elif urgency_display == "Medium":
                urgency_display = "🟡 Medium"
            elif urgency_display == "Low":
                urgency_display = "🟢 Low"
                
            # Format the created date more nicely
            created_date = complaint.created_at.strftime("%b %d, %Y at %H:%M")
            
            # Format as markdown for better display
            output = f"### Complaint #{complaint.id}\n\n"
            
            # Main complaint text
            output += f"**Complaint Text:**\n> {complaint.complaint_text}\n\n"
            
            # Metadata in a formatted table
            output += "| Property | Value |\n"
            output += "|----------|-------|\n"
            output += f"| Category | {complaint.category or 'Not set'} |\n"
            output += f"| Urgency | {urgency_display} |\n"
            output += f"| Status | {complaint.status} |\n"
            output += f"| Created | {created_date} |\n"
            
            if complaint.assigned_to is not None:
                output += f"| Assigned to | {complaint.assigned_to} |\n"
            
            output += "\n"
            
            if complaint.response is not None:
                output += f"**Response:**\n> {complaint.response}\n\n"
            else:
                output += "**No response has been provided yet.**\n\n"
                
            # Add quick action hints
            output += "You can update this complaint's status with 'update complaint status' command."
            

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
                return f"⚠️ **Invalid status**. Please use one of: {', '.join(valid_statuses)}"
            
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            
            if not complaint:
                return f"❌ **Error**: No complaint found with ID {complaint_id}"
            
            # Store the previous status for the response message
            previous_status = complaint.status
            
            # Update the complaint status
            setattr(complaint, "status", status)
            db.commit()
            db.refresh(complaint)
            
            # Create formatted response with status change details and emoji indicators
            status_emoji = "🔄"
            if status == "Resolved":
                status_emoji = "✅"
            elif status == "Closed":
                status_emoji = "🔒"
            elif status == "In Progress":
                status_emoji = "⏳"
                
            output = f"### {status_emoji} Status Updated\n\n"
            output += f"**Complaint #{complaint_id}** status has been changed:\n\n"
            
            output += "| | |\n"
            output += "|---|---|\n"
            output += f"| Previous status | {previous_status} |\n"
            output += f"| New status | **{status}** |\n"
            output += f"| Updated at | {complaint.updated_at.strftime('%b %d, %Y at %H:%M')} |\n\n"
            
            output += "Would you like to view the full details of this complaint now?"
            
            return output
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
                return f"⚠️ **Invalid category**. Please use one of: {', '.join(valid_categories)}"
            
            complaints = db.query(Complaint).filter(Complaint.category == category).all()
            
            if not complaints:
                return f"📊 No complaints found in category **{category}**"
            
            status_counts = {}
            urgency_counts = {}
            assigned_count = 0
            has_response_count = 0
            
            for complaint in complaints:
                status_counts[complaint.status] = status_counts.get(complaint.status, 0) + 1
                urgency_counts[complaint.urgency] = urgency_counts.get(complaint.urgency, 0) + 1
                
                # Count assigned and responded complaints
                if complaint.assigned_to is not None:
                    assigned_count += 1
                if complaint.response is not None:
                    has_response_count += 1
            
            # Calculate percentages for key metrics
            total_complaints = len(complaints)
            assigned_percentage = round((assigned_count / total_complaints) * 100, 1) if total_complaints > 0 else 0
            response_percentage = round((has_response_count / total_complaints) * 100, 1) if total_complaints > 0 else 0
            
            # Format output with Markdown for better UI display
            output = f"### 📊 Statistics for {category} Complaints\n\n"
            
            # Summary metrics in a table
            output += "| Metric | Value |\n"
            output += "|--------|-------|\n"
            output += f"| Total complaints | **{total_complaints}** |\n"
            output += f"| Assigned | {assigned_count} ({assigned_percentage}%) |\n"
            output += f"| With responses | {has_response_count} ({response_percentage}%) |\n\n"
            
            # Status breakdown in a table
            output += "#### Status Distribution\n\n"
            output += "| Status | Count | Percentage |\n"
            output += "|--------|-------|------------|\n"
            
            for status, count in status_counts.items():
                percentage = round((count / total_complaints) * 100, 1)
                output += f"| {status} | {count} | {percentage}% |\n"
            
            # Urgency breakdown in a table
            output += "\n#### Urgency Distribution\n\n"
            output += "| Urgency | Count | Percentage |\n"
            output += "|---------|-------|------------|\n"
            
            for urgency, count in urgency_counts.items():
                percentage = round((count / total_complaints) * 100, 1)
                urgency_display = urgency if urgency else "Not set"
                
                # Add emoji indicators based on urgency
                if urgency == "Critical":
                    urgency_display = "🔴 Critical"
                elif urgency == "High":
                    urgency_display = "🟠 High"
                elif urgency == "Medium":
                    urgency_display = "🟡 Medium"
                elif urgency == "Low":
                    urgency_display = "🟢 Low"
                
                output += f"| {urgency_display} | {count} | {percentage}% |\n"
            
            output += "\nWould you like to search for specific complaints in this category?"
            
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
