from langchain.tools import BaseTool
from typing import Dict, Any, List, Type, Optional, Tuple
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import pandas as pd
import base64
import io
from datetime import datetime, timedelta

from app.db.database import SessionLocal
from app.models.domain.complaint import Complaint, Category, Urgency
from app.services.complaint_service import ComplaintService
from app.services.eda_service import EdaService
from app.models.schemas.complaint import ComplaintCreate, ComplaintUpdate
from app.ml.model import get_model_predictor
from app.models.schemas.complaint import ComplaintCreate, ComplaintUpdate
from app.ml.model import get_model_predictor


class SearchComplaintInput(BaseModel):
    query: str = Field(..., description="The search query to find complaints")


class GetComplaintInput(BaseModel):
    complaint_id: int = Field(..., description="The ID of the complaint to retrieve")


class UpdateComplaintStatusInput(BaseModel):
    complaint_id: int = Field(..., description="The ID of the complaint to update")
    status: str = Field(..., description="The new status for the complaint (Pending, In Progress, Resolved, Closed)")


class GetComplaintStatsByTypeInput(BaseModel):
    category: str = Field(..., description="The category to filter by (Academic, Facilities, Housing, IT Support, Financial Aid, Campus Life, Other)")


class AssignComplaintInput(BaseModel):
    complaint_id: int = Field(..., description="The ID of the complaint to assign")
    assigned_to: str = Field(..., description="Name of the staff member to assign the complaint to")


class RespondToComplaintInput(BaseModel):
    complaint_id: int = Field(..., description="The ID of the complaint to respond to")
    response: str = Field(..., description="The response text to add to the complaint")


class PredictCategoryInput(BaseModel):
    complaint_text: str = Field(..., description="Complaint text to analyze and predict category/urgency for")


class GetPriorityQueueInput(BaseModel):
    limit: int = Field(default=5, description="Number of top priority complaints to retrieve")
    status: Optional[str] = Field(default=None, description="Filter by status (optional)")


class GetTrendingTopicsInput(BaseModel):
    days: int = Field(default=7, description="Number of days to look back for trend analysis")
    num_topics: int = Field(default=3, description="Number of topics to extract")


class BatchUpdateStatusInput(BaseModel):
    category: Optional[str] = Field(default=None, description="Filter complaints by category")
    urgency: Optional[str] = Field(default=None, description="Filter complaints by urgency")
    current_status: str = Field(..., description="Current status of the complaints to update")
    new_status: str = Field(..., description="New status to apply to filtered complaints")
    limit: int = Field(default=10, description="Maximum number of complaints to update")


class SearchComplaintTool(BaseTool):
    name: str = "search_complaints" 
    description: str = "Search for complaints using keywords or phrases"
    args_schema: Type[SearchComplaintInput] = SearchComplaintInput # type: ignore
    
    def _run(self, query: str) -> str:
        from app.chatbot.embeddings import ComplaintEmbedding
        
        try:
            embedding_manager = ComplaintEmbedding()
            vector_store = embedding_manager.get_vector_store()
            results = vector_store.similarity_search(query, k=5)
            
            if not results:
                return "No complaints found matching your query."
            
            # Create a formatted markdown table for better UI display
            output = f"### 🔍 Search Results for: '{query}'\n\n"
            output += "| ID | Preview | Category | Urgency | Status |\n"
            output += "|---|---------|----------|---------|--------|\n"
            
            for doc in results:
                # Get a preview of the complaint text (first 60 chars)
                preview = doc.page_content[:60].replace("\n", " ").strip() + "..."
                
                # Format urgency with emoji indicators
                urgency_display = doc.metadata['urgency']
                if urgency_display == "Critical":
                    urgency_display = "🔴 Critical"
                elif urgency_display == "High":
                    urgency_display = "🟠 High"
                elif urgency_display == "Medium":
                    urgency_display = "🟡 Medium"
                elif urgency_display == "Low":
                    urgency_display = "🟢 Low"
                
                # Add the table row
                output += f"| {doc.metadata['id']} | {preview} | {doc.metadata['category']} | {urgency_display} | {doc.metadata['status']} |\n"
            
            output += "\n\n**Pro tip:** To view full details of a specific complaint, ask me to 'get complaint #ID'"
            return output
        except Exception as e:
            return f"Error searching complaints: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        return self._run(query)


class GetComplaintTool(BaseTool):
    name: str = "get_complaint"
    description: str = "Get details about a specific complaint by ID"
    args_schema: Type[GetComplaintInput] = GetComplaintInput # type: ignore
    
    def _run(self, complaint_id: int) -> str:
        db = SessionLocal()
        try:
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            if not complaint:
                return f"❌ No complaint found with ID {complaint_id}"
            
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
            output = f"### 📋 Complaint #{complaint.id}\n\n"
            
            # Status indicator
            status_indicator = "⏱️"
            if str(complaint.status) == "In Progress":
                status_indicator = "⚙️" 
            elif str(complaint.status) == "Resolved":
                status_indicator = "✅"
            elif str(complaint.status) == "Closed":
                status_indicator = "🔒"
                
            output += f"**Status:** {status_indicator} {complaint.status}\n\n"
            
            # Main complaint text
            output += f"**Complaint Text:**\n> {complaint.complaint_text}\n\n"
            
            # Metadata in a formatted table
            output += "| Property | Value |\n"
            output += "|----------|-------|\n"
            output += f"| Category | {complaint.category or 'Not set'} |\n"
            output += f"| Urgency | {urgency_display} |\n"
            output += f"| Created | {created_date} |\n"
            
            if complaint.assigned_to is not None:
                output += f"| Assigned to | {complaint.assigned_to} |\n"
            else:
                output += f"| Assigned to | *Unassigned* |\n"
            
            output += "\n"
            
            if complaint.response is not None:
                output += f"**Response:**\n> {complaint.response}\n\n"
            else:
                output += "**No response has been provided yet.**\n\n"
                
            # Add quick action hints
            output += "**Available Actions:**\n"
            if str(complaint.status) != "Closed":
                actions = []
                if complaint.assigned_to is None:
                    actions.append("• Assign this complaint to a staff member")
                if complaint.response is None:
                    actions.append("• Add a response to this complaint") 
                actions.append("• Update the complaint status")
                output += "\n".join(actions)
            else:
                output += "• This complaint is closed. No further actions needed."
            
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
    args_schema: Type[UpdateComplaintStatusInput] = UpdateComplaintStatusInput # type: ignore
    
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
            
            # Don't update if status is already the same
            if str(previous_status) == status:
                return f"ℹ️ Complaint #{complaint_id} is already in '{status}' status. No changes made."
            
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
                status_emoji = "⚙️"
            elif status == "Pending":
                status_emoji = "⏱️"
                
            output = f"### {status_emoji} Status Updated\n\n"
            output += f"**Complaint #{complaint_id}** status has been changed:\n\n"
            
            output += "| | |\n"
            output += "|---|---|\n"
            output += f"| Previous status | {previous_status} |\n"
            output += f"| New status | **{status}** |\n"
            output += f"| Updated at | {complaint.updated_at.strftime('%b %d, %Y at %H:%M')} |\n\n"
            
            if status == "Resolved" and complaint.response is None:
                output += "⚠️ **Note:** This complaint is marked as resolved but doesn't have a response. Consider adding a response."
            
            output += "\n\nWould you like to view the full details of this complaint now?"
            
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
    args_schema: Type[GetComplaintStatsByTypeInput] = GetComplaintStatsByTypeInput # type: ignore
    
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
            resolved_complaints = 0
            avg_resolution_time = None
            resolution_times = []
            
            for complaint in complaints:
                status_counts[complaint.status] = status_counts.get(complaint.status, 0) + 1
                urgency_counts[str(complaint.urgency)] = urgency_counts.get(str(complaint.urgency), 0) + 1
                
                # Count assigned and responded complaints
                if complaint.assigned_to is not None:
                    assigned_count += 1
                if complaint.response is not None:
                    has_response_count += 1
                
                # Calculate resolution times for resolved/closed complaints
                if complaint.status in ["Resolved", "Closed"]:
                    resolved_complaints += 1
                    if complaint.created_at is not None and complaint.updated_at is not None:
                        resolution_time = (complaint.updated_at - complaint.created_at).total_seconds() / 3600  # hours
                        resolution_times.append(resolution_time)
            
            # Calculate average resolution time if we have data
            if resolution_times:
                avg_resolution_time = sum(resolution_times) / len(resolution_times)
            
            # Calculate percentages for key metrics
            total_complaints = len(complaints)
            assigned_percentage = round((assigned_count / total_complaints) * 100, 1) if total_complaints > 0 else 0
            response_percentage = round((has_response_count / total_complaints) * 100, 1) if total_complaints > 0 else 0
            resolved_percentage = round((resolved_complaints / total_complaints) * 100, 1) if total_complaints > 0 else 0
            
            # Format output with Markdown for better UI display
            output = f"### 📊 Statistics for {category} Complaints\n\n"
            
            # Summary metrics in a table
            output += "| Metric | Value |\n"
            output += "|--------|-------|\n"
            output += f"| Total complaints | **{total_complaints}** |\n"
            output += f"| Assigned | {assigned_count} ({assigned_percentage}%) |\n"
            output += f"| With responses | {has_response_count} ({response_percentage}%) |\n"
            output += f"| Resolved/Closed | {resolved_complaints} ({resolved_percentage}%) |\n"
            
            if avg_resolution_time:
                # Format resolution time nicely
                if avg_resolution_time < 24:
                    output += f"| Avg. resolution time | {avg_resolution_time:.1f} hours |\n\n"
                else:
                    days = avg_resolution_time / 24
                    output += f"| Avg. resolution time | {days:.1f} days |\n\n"
            
            # Status breakdown in a table
            output += "#### Status Distribution\n\n"
            output += "| Status | Count | Percentage |\n"
            output += "|--------|-------|------------|\n"
            
            for status, count in status_counts.items():
                percentage = round((count / total_complaints) * 100, 1)
                status_emoji = "⏱️"
                if status == "In Progress":
                    status_emoji = "⚙️" 
                elif status == "Resolved":
                    status_emoji = "✅"
                elif status == "Closed":
                    status_emoji = "🔒"
                output += f"| {status_emoji} {status} | {count} | {percentage}% |\n"
            
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
            
            # Add action recommendations based on stats
            output += "\n### 💡 Insights\n\n"
            
            if resolved_percentage < 50:
                output += "- **Action needed:** Resolution rate is below 50%. Consider allocating more resources to address these complaints.\n"
                
            unassigned = total_complaints - assigned_count
            if unassigned > 0:
                output += f"- **Needs attention:** {unassigned} complaints are not assigned to any staff member.\n"
                
            no_response = total_complaints - has_response_count
            if no_response > 0:
                output += f"- **Communication gap:** {no_response} complaints have not received any response yet.\n"
            
            output += "\nWould you like to search for specific complaints in this category?"
            
            return output
        except Exception as e:
            return f"Error getting complaint statistics: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, category: str) -> str:
        return self._run(category)


class AssignComplaintTool(BaseTool):
    name: str = "assign_complaint"
    description: str = "Assign a complaint to a staff member"
    args_schema: Type[AssignComplaintInput] = AssignComplaintInput # type: ignore
    
    def _run(self, complaint_id: int, assigned_to: str) -> str:
        db = SessionLocal()
        try:
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            
            if not complaint:
                return f"❌ **Error**: No complaint found with ID {complaint_id}"
            
            # Store previous assignment for message
            previous_assignment = str(complaint.assigned_to) if complaint.assigned_to is not None else None
            
            # Update the assignment
            setattr(complaint, "assigned_to", assigned_to)
            db.commit()
            db.refresh(complaint)
            
            output = "### 👤 Assignment Updated\n\n"
            output += f"**Complaint #{complaint_id}** has been assigned:\n\n"
            
            output += "| | |\n"
            output += "|---|---|\n"
            if previous_assignment:
                output += f"| Previous assignment | {previous_assignment} |\n"
            else:
                output += "| Previous assignment | *Unassigned* |\n"
            output += f"| New assignment | **{assigned_to}** |\n"
            output += f"| Updated at | {complaint.updated_at.strftime('%b %d, %Y at %H:%M')} |\n\n"
            
            # If complaint is still in pending status, suggest changing to in progress
            if str(complaint.status) == "Pending":
                output += "**Suggestion:** Consider updating the complaint status to 'In Progress' now that it's been assigned."
            
            return output
        except Exception as e:
            db.rollback()
            return f"Error assigning complaint: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, complaint_id: int, assigned_to: str) -> str:
        return self._run(complaint_id, assigned_to)


class RespondToComplaintTool(BaseTool):
    name: str = "respond_to_complaint"
    description: str = "Add a response to a complaint"
    args_schema: Type[RespondToComplaintInput] = RespondToComplaintInput # type: ignore
    
    def _run(self, complaint_id: int, response: str) -> str:
        db = SessionLocal()
        try:
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            
            if not complaint:
                return f"❌ **Error**: No complaint found with ID {complaint_id}"
            
            # Check if already has a response
            had_previous_response = complaint.response is not None
            
            # Update the response
            setattr(complaint, "response", response)
            db.commit()
            db.refresh(complaint)
            
            output = "### 💬 Response Added\n\n"
            output += f"**Response has been {'updated' if had_previous_response else 'added'} to complaint #{complaint_id}:**\n\n"
            
            output += f"> {response}\n\n"
            
            output += f"Updated at: {complaint.updated_at.strftime('%b %d, %Y at %H:%M')}\n\n"
            
            # If complaint is not resolved/closed, suggest updating status
            if complaint.status not in ["Resolved", "Closed"]:
                output += "**Suggestion:** Consider updating the complaint status to 'Resolved' if this response addresses the issue completely."
            
            return output
        except Exception as e:
            db.rollback()
            return f"Error adding response to complaint: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, complaint_id: int, response: str) -> str:
        return self._run(complaint_id, response)


class PredictCategoryTool(BaseTool):
    name: str = "predict_complaint_category"
    description: str = "Analyze complaint text to predict category and urgency"
    args_schema: Type[PredictCategoryInput] = PredictCategoryInput # type: ignore
    
    def _run(self, complaint_text: str) -> str:
        try:
            # Get model predictor
            model_predictor = get_model_predictor()
            
            # Get prediction
            prediction = model_predictor.predict(complaint_text)
            
            category = prediction["category"]
            urgency = prediction["urgency"]
            conf_category = prediction["confidence_category"] * 100
            conf_urgency = prediction["confidence_urgency"] * 100
            
            # Format urgency with emoji
            urgency_display = urgency
            if urgency == "Critical":
                urgency_display = "🔴 Critical"
            elif urgency == "High":
                urgency_display = "🟠 High"
            elif urgency == "Medium":
                urgency_display = "🟡 Medium"
            elif urgency == "Low":
                urgency_display = "🟢 Low"
            
            # Create output with confidence levels
            output = "### 🤖 Complaint Analysis Prediction\n\n"
            
            # Preview of analyzed text
            text_preview = complaint_text
            if len(text_preview) > 100:
                text_preview = text_preview[:100] + "..."
            
            output += f"**Text analyzed:** {text_preview}\n\n"
            
            output += "| Prediction | Value | Confidence |\n"
            output += "|------------|-------|------------|\n"
            output += f"| Category | {category} | {conf_category:.1f}% |\n"
            output += f"| Urgency | {urgency_display} | {conf_urgency:.1f}% |\n\n"
            
            output += "**Note:** These predictions are based on the complaint text using the SCOPE ML model."
            
            return output
        except Exception as e:
            return f"Error predicting complaint category: {str(e)}"
    
    async def _arun(self, complaint_text: str) -> str:
        return self._run(complaint_text)


class GetPriorityQueueTool(BaseTool):
    name: str = "get_priority_queue"
    description: str = "Get a list of high priority complaints that need attention"
    args_schema: Type[GetPriorityQueueInput] = GetPriorityQueueInput # type: ignore
    
    def _run(self, limit: int = 5, status: Optional[str] = None) -> str:
        db = SessionLocal()
        try:
            # Build query - get open complaints sorted by urgency and creation date
            query = db.query(Complaint)
            
            # Filter by status if provided, otherwise show non-closed complaints
            if status:
                query = query.filter(Complaint.status == status)
            else:
                query = query.filter(Complaint.status != "Closed")
            
            # Sort by urgency (Critical > High > Medium > Low)
            # Within each urgency level, sort by creation date (older first)
            complaints = query.order_by(
                # Custom order for urgency
                Complaint.urgency.in_([Urgency.CRITICAL, Urgency.HIGH, Urgency.MEDIUM, Urgency.LOW]).desc(),
                Complaint.created_at
            ).limit(limit).all()
            
            if not complaints:
                message = f"No complaints found with status '{status}'" if status else "No open complaints found"
                return f"✅ Queue Empty: {message}"
            
            output = "### 🚨 Priority Complaint Queue\n\n"
            output += f"Here are the top {len(complaints)} complaints that need attention:\n\n"
            
            output += "| ID | Urgency | Status | Age | Category | Preview |\n"
            output += "|-----|---------|--------|-----|----------|--------|\n"
            
            for complaint in complaints:
                # Calculate age
                age_days = (datetime.now() - complaint.created_at).days
                age_display = f"{age_days}d" if age_days > 0 else "Today"
                
                # Get urgency display with emoji
                urgency_display = str(complaint.urgency)
                if urgency_display == "Critical":
                    urgency_display = "🔴 Critical"
                elif urgency_display == "High":
                    urgency_display = "🟠 High"
                elif urgency_display == "Medium":
                    urgency_display = "🟡 Medium"
                elif urgency_display == "Low":
                    urgency_display = "🟢 Low"
                
                # Get preview of complaint text
                text = str(complaint.complaint_text) if complaint.complaint_text is not None else ""
                preview = text[:40] + "..." if len(text) > 40 else text
                
                # Status indicator
                status_indicator = "⏱️"
                if str(complaint.status) == "In Progress":
                    status_indicator = "⚙️" 
                elif str(complaint.status) == "Resolved":
                    status_indicator = "✅"
                
                output += f"| {complaint.id} | {urgency_display} | {status_indicator} {complaint.status} | {age_display} | {complaint.category} | {preview} |\n"
            
            output += "\n**Pro tip:** To view full details of a specific complaint, ask me to 'get complaint #ID'"
            
            return output
        except Exception as e:
            return f"Error retrieving priority queue: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, limit: int = 5, status: Optional[str] = None) -> str:
        return self._run(limit, status)


class GetTrendingTopicsTool(BaseTool):
    name: str = "get_trending_topics"
    description: str = "Identify trending topics from recent complaints"
    args_schema: Type[GetTrendingTopicsInput] = GetTrendingTopicsInput # type: ignore
    
    def _run(self, days: int = 7, num_topics: int = 3) -> str:
        db = SessionLocal()
        try:
            # Get complaints from recent days
            cutoff_date = datetime.now() - timedelta(days=days)
            complaints = db.query(Complaint).filter(
                Complaint.created_at >= cutoff_date
            ).all()
            
            if not complaints or len(complaints) < 3:
                return f"📈 Not enough recent complaints to identify trends. Found {len(complaints)} complaints in the last {days} days."
            
            # Use the EdaService to extract topics
            eda_service = EdaService()
            try:
                # Get topic analysis
                topics = eda_service.get_topics(db, n_topics=num_topics, n_words=8)
                
                # Format the output
                output = f"### 📈 Trending Topics (Last {days} Days)\n\n"
                
                for i, topic in enumerate(topics["topics"]):
                    output += f"#### Topic {i+1}: "
                    output += ", ".join([f"**{w}**" for w in topic["top_words"][:5]])
                    output += "\n\n"
                    
                    # Weight as percentage
                    weight_percent = topic["weight"] * 100
                    output += f"*Prominence: {weight_percent:.1f}%*\n\n"
                    
                    # Sample complaints
                    output += "**Sample complaints:**\n"
                    for j, doc in enumerate(topic["documents"][:2]):
                        output += f"- Complaint #{doc['id']}: {doc['text']}\n"
                    
                    output += "\n"
                
                output += f"\nAnalysis based on {len(complaints)} complaints from the past {days} days."
                return output
            except Exception:
                # Fallback to simpler word frequency analysis
                return self._fallback_word_analysis(complaints, days)
            
        except Exception as e:
            return f"Error analyzing trending topics: {str(e)}"
        finally:
            db.close()
    
    def _fallback_word_analysis(self, complaints, days):
        # Simple word frequency analysis as fallback
        from collections import Counter
        import re
        
        # Combine texts
        texts = [c.complaint_text for c in complaints]
        all_text = " ".join(texts)
        
        # Simple preprocessing
        all_text = all_text.lower()
        all_text = re.sub(r'[^\w\s]', '', all_text)
        
        # Remove common stopwords
        stopwords = {'the', 'and', 'to', 'of', 'is', 'in', 'it', 'that', 'was', 'for', 
                    'on', 'are', 'with', 'as', 'this', 'be', 'have', 'am', 'at', 'by',
                    'not', 'but', 'or', 'from', 'my', 'an', 'so', 'we', 'can', 'i', 'a'}
        
        words = [word for word in all_text.split() if word not in stopwords and len(word) > 3]
        
        # Count word frequency
        word_counts = Counter(words)
        
        # Get the most common words
        common_words = word_counts.most_common(15)
        
        output = f"### 📈 Trending Topics (Last {days} Days)\n\n"
        output += "| Word | Frequency |\n"
        output += "|------|----------:|\n"
        
        for word, count in common_words:
            output += f"| **{word}** | {count} |\n"
        
        output += f"\nAnalysis based on {len(complaints)} complaints from the past {days} days."
        return output
    
    async def _arun(self, days: int = 7, num_topics: int = 3) -> str:
        return self._run(days, num_topics)


class BatchUpdateStatusTool(BaseTool):
    name: str = "batch_update_status"
    description: str = "Update status for multiple complaints matching criteria"
    args_schema: Type[BatchUpdateStatusInput] = BatchUpdateStatusInput # type: ignore
    
    def _run(self, category: Optional[str] = None, urgency: Optional[str] = None, 
             current_status: Optional[str] = None, new_status: Optional[str] = None, limit: int = 10) -> str:
        db = SessionLocal()
        try:
            # Validate statuses
            valid_statuses = ["Pending", "In Progress", "Resolved", "Closed"]
            if current_status not in valid_statuses:
                return f"⚠️ **Invalid current status**. Please use one of: {', '.join(valid_statuses)}"
            if new_status not in valid_statuses:
                return f"⚠️ **Invalid new status**. Please use one of: {', '.join(valid_statuses)}"
            
            # Build query to find complaints matching criteria
            query = db.query(Complaint).filter(Complaint.status == current_status)
            
            # Add optional filters
            if category:
                valid_categories = [c.value for c in Category]
                if category not in valid_categories:
                    return f"⚠️ **Invalid category**. Please use one of: {', '.join(valid_categories)}"
                query = query.filter(Complaint.category == category)
                
            if urgency:
                valid_urgencies = [u.value for u in Urgency]
                if urgency not in valid_urgencies:
                    return f"⚠️ **Invalid urgency**. Please use one of: {', '.join(valid_urgencies)}"
                query = query.filter(Complaint.urgency == urgency)
            
            # Get complaints to update
            complaints = query.limit(limit).all()
            
            if not complaints:
                filter_desc = []
                if category:
                    filter_desc.append(f"category '{category}'")
                if urgency:
                    filter_desc.append(f"urgency '{urgency}'")
                filter_desc.append(f"status '{current_status}'")
                filter_str = " and ".join(filter_desc)
                
                return f"❌ No complaints found matching {filter_str}"
            
            # Update the complaints
            count = 0
            for complaint in complaints:
                setattr(complaint, "status", new_status)
                count += 1
            
            db.commit()
            
            # Format the output
            status_emoji = "🔄"
            if new_status == "Resolved":
                status_emoji = "✅"
            elif new_status == "Closed":
                status_emoji = "🔒"
            elif new_status == "In Progress":
                status_emoji = "⚙️"
            
            output = f"### {status_emoji} Batch Update Complete\n\n"
            output += f"Updated **{count} complaints** from status '{current_status}' to '{new_status}'.\n\n"
            
            # Details about the update
            filter_desc = []
            if category:
                filter_desc.append(f"category '{category}'")
            if urgency:
                filter_desc.append(f"urgency '{urgency}'")
            
            if filter_desc:
                filter_str = " and ".join(filter_desc)
                output += f"**Filters applied:** {filter_str}\n\n"
            
            # List of updated complaints
            output += "**Updated complaints:**\n\n"
            output += "| ID | Category | Urgency | Created |\n"
            output += "|-----|----------|---------|--------|\n"
            
            for c in complaints:
                created_date = c.created_at.strftime("%b %d, %Y")
                output += f"| {c.id} | {c.category} | {c.urgency} | {created_date} |\n"
            
            return output
        except Exception as e:
            db.rollback()
            return f"Error during batch update: {str(e)}"
        finally:
            db.close()
    
    async def _arun(self, category: Optional[str] = None, urgency: Optional[str] = None, 
                   current_status: Optional[str] = None, new_status: Optional[str] = None, limit: int = 10) -> str:
        return self._run(category, urgency, current_status, new_status, limit)


class StatusDistributionPlotInput(BaseModel):
    time_period: Optional[int] = Field(default=None, description="Optional: Number of days to look back, leave empty for all time")


class CategoryDistributionPlotInput(BaseModel):
    time_period: Optional[int] = Field(default=None, description="Optional: Number of days to look back, leave empty for all time")


class UrgencyDistributionPlotInput(BaseModel):
    by_category: bool = Field(default=False, description="Whether to show urgency distribution by category")
    time_period: Optional[int] = Field(default=None, description="Optional: Number of days to look back, leave empty for all time")


class TimeTrendPlotInput(BaseModel):
    time_period: int = Field(default=30, description="Number of days to look back for the trend")
    groupby: str = Field(default="day", description="Group complaints by: 'day', 'week', or 'month'")


class CategoryComparisonPlotInput(BaseModel):
    categories: List[str] = Field(..., description="List of categories to compare")
    metric: str = Field(default="volume", description="Metric for comparison: 'volume', 'urgency', or 'status'")


class ResolutionTimePlotInput(BaseModel):
    time_period: Optional[int] = Field(default=None, description="Optional: Number of days to look back, leave empty for all time")


class StatusDistributionPlotTool(BaseTool):
    name: str = "generate_status_distribution_plot"
    description: str = "Generate a pie chart showing the distribution of complaint statuses"
    args_schema: Type[StatusDistributionPlotInput] = StatusDistributionPlotInput # type: ignore

    def _run(self, time_period: Optional[int] = None) -> str:
        try:
            from app.chatbot.visualizations import VisualizationService
            
            viz_service = VisualizationService()
            img_data = viz_service.generate_status_distribution_plot(time_period)
            
            if isinstance(img_data, str) and not img_data.startswith("Error"):
                output = f"### 📊 Complaint Status Distribution\n\n"
                if time_period:
                    output += f"*Data from the last {time_period} days*\n\n"
                else:
                    output += f"*Data from all time*\n\n"
                
                output += f"![Status Distribution Plot](data:image/png;base64,{img_data})\n\n"
                
                output += "This chart shows the distribution of complaints across different status categories:\n"
                output += "- **Pending**: Complaints that have been submitted but not yet addressed\n"
                output += "- **In Progress**: Complaints currently being handled by staff\n"
                output += "- **Resolved**: Complaints that have been successfully addressed\n"
                output += "- **Closed**: Complaints that have been finalized\n"
                
                return output
            else:
                return img_data  # Error message
                
        except Exception as e:
            return f"Error generating status distribution plot: {str(e)}"

    async def _arun(self, time_period: Optional[int] = None) -> str:
        return self._run(time_period)


class CategoryDistributionPlotTool(BaseTool):
    name: str = "generate_category_distribution_plot"
    description: str = "Generate a bar chart showing the distribution of complaint categories"
    args_schema: Type[CategoryDistributionPlotInput] = CategoryDistributionPlotInput # type: ignore

    def _run(self, time_period: Optional[int] = None) -> str:
        try:
            from app.chatbot.visualizations import VisualizationService
            
            viz_service = VisualizationService()
            img_data = viz_service.generate_category_distribution_plot(time_period)
            
            if isinstance(img_data, str) and not img_data.startswith("Error"):
                output = f"### 📊 Complaint Category Distribution\n\n"
                if time_period:
                    output += f"*Data from the last {time_period} days*\n\n"
                else:
                    output += f"*Data from all time*\n\n"
                
                output += f"![Category Distribution Plot](data:image/png;base64,{img_data})\n\n"
                
                output += "This chart shows the distribution of complaints across different categories. "
                output += "The percentage values indicate what portion of total complaints each category represents.\n\n"
                
                output += "Would you like to see more detailed statistics for any specific category?"
                
                return output
            else:
                return img_data  # Error message
                
        except Exception as e:
            return f"Error generating category distribution plot: {str(e)}"

    async def _arun(self, time_period: Optional[int] = None) -> str:
        return self._run(time_period)


class UrgencyDistributionPlotTool(BaseTool):
    name: str = "generate_urgency_distribution_plot"
    description: str = "Generate a chart showing the distribution of complaint urgency levels"
    args_schema: Type[UrgencyDistributionPlotInput] = UrgencyDistributionPlotInput # type: ignore

    def _run(self, by_category: bool = False, time_period: Optional[int] = None) -> str:
        try:
            from app.chatbot.visualizations import VisualizationService
            
            viz_service = VisualizationService()
            img_data = viz_service.generate_urgency_distribution_plot(by_category, time_period)
            
            if isinstance(img_data, str) and not img_data.startswith("Error"):
                output = f"### 📊 Complaint Urgency Distribution\n\n"
                if time_period:
                    output += f"*Data from the last {time_period} days*\n\n"
                else:
                    output += f"*Data from all time*\n\n"
                
                output += f"![Urgency Distribution Plot](data:image/png;base64,{img_data})\n\n"
                
                if by_category:
                    output += "This chart shows how urgency levels are distributed across different categories. "
                    output += "For each category, you can see the proportion of Critical (🔴), High (🟠), Medium (🟡), and Low (🟢) urgency complaints.\n\n"
                    output += "The number at the top of each bar shows the total complaint count for that category."
                else:
                    output += "This chart shows the overall distribution of complaint urgency levels:\n"
                    output += "- 🔴 **Critical**: Highest priority issues requiring immediate attention\n"
                    output += "- 🟠 **High**: Important issues that should be addressed promptly\n"
                    output += "- 🟡 **Medium**: Standard priority issues\n"
                    output += "- 🟢 **Low**: Lower priority issues\n"
                
                return output
            else:
                return img_data  # Error message
                
        except Exception as e:
            return f"Error generating urgency distribution plot: {str(e)}"

    async def _arun(self, by_category: bool = False, time_period: Optional[int] = None) -> str:
        return self._run(by_category, time_period)


class TimeTrendPlotTool(BaseTool):
    name: str = "generate_time_trend_plot"
    description: str = "Generate a line chart showing complaint volume trends over time"
    args_schema: Type[TimeTrendPlotInput] = TimeTrendPlotInput # type: ignore

    def _run(self, time_period: int = 30, groupby: str = "day") -> str:
        try:
            from app.chatbot.visualizations import VisualizationService
            
            viz_service = VisualizationService()
            img_data = viz_service.generate_time_trend_plot(time_period, groupby)
            
            if isinstance(img_data, str) and not img_data.startswith("Error"):
                output = f"### 📈 Complaint Volume Trend\n\n"
                output += f"*Data from the last {time_period} days, grouped by {groupby}*\n\n"
                
                output += f"![Time Trend Plot](data:image/png;base64,{img_data})\n\n"
                
                output += "This chart shows how complaint volume has changed over time. "
                output += "The dotted line shows the trend direction, and the green line indicates the average volume.\n\n"
                
                output += "Any specific time period you'd like to explore further?"
                
                return output
            else:
                return img_data  # Error message
                
        except Exception as e:
            return f"Error generating time trend plot: {str(e)}"

    async def _arun(self, time_period: int = 30, groupby: str = "day") -> str:
        return self._run(time_period, groupby)


class CategoryComparisonPlotTool(BaseTool):
    name: str = "generate_category_comparison_plot"
    description: str = "Generate a chart comparing selected complaint categories"
    args_schema: Type[CategoryComparisonPlotInput] = CategoryComparisonPlotInput # type: ignore

    def _run(self, categories: List[str], metric: str = "volume") -> str:
        try:
            from app.chatbot.visualizations import VisualizationService
            
            # Validate categories
            valid_categories = [c.value for c in Category]
            invalid_categories = [c for c in categories if c not in valid_categories]
            if invalid_categories:
                return f"⚠️ Invalid categories: {', '.join(invalid_categories)}. Please use valid categories: {', '.join(valid_categories)}"
            
            # Validate metric
            valid_metrics = ["volume", "urgency", "status"]
            if metric not in valid_metrics:
                return f"⚠️ Invalid metric: {metric}. Please use one of: {', '.join(valid_metrics)}"
            
            viz_service = VisualizationService()
            img_data = viz_service.generate_category_comparison_plot(categories, metric)
            
            if isinstance(img_data, str) and not img_data.startswith("Error"):
                metric_names = {
                    "volume": "Complaint Volume",
                    "urgency": "Urgency Distribution",
                    "status": "Status Distribution"
                }
                
                output = f"### 📊 Category Comparison: {metric_names.get(metric)}\n\n"
                output += f"*Comparing categories: {', '.join(categories)}*\n\n"
                
                output += f"![Category Comparison Plot](data:image/png;base64,{img_data})\n\n"
                
                if metric == "volume":
                    output += "This chart compares the total number of complaints across the selected categories."
                elif metric == "urgency":
                    output += "This chart compares how urgency levels are distributed within each selected category. "
                    output += "The percentages show what portion of complaints in each category fall into each urgency level."
                elif metric == "status":
                    output += "This chart compares how statuses are distributed within each selected category. "
                    output += "The percentages show what portion of complaints in each category are in each status."
                
                return output
            else:
                return img_data  # Error message
                
        except Exception as e:
            return f"Error generating category comparison plot: {str(e)}"

    async def _arun(self, categories: List[str], metric: str = "volume") -> str:
        return self._run(categories, metric)


class ResolutionTimePlotTool(BaseTool):
    name: str = "generate_resolution_time_plot"
    description: str = "Generate a box plot showing complaint resolution times by category"
    args_schema: Type[ResolutionTimePlotInput] = ResolutionTimePlotInput # type: ignore

    def _run(self, time_period: Optional[int] = None) -> str:
        try:
            from app.chatbot.visualizations import VisualizationService
            
            viz_service = VisualizationService()
            img_data = viz_service.generate_resolution_time_plot(time_period)
            
            if isinstance(img_data, str) and not img_data.startswith("Error"):
                output = f"### 📊 Complaint Resolution Time Analysis\n\n"
                if time_period:
                    output += f"*Data from complaints resolved in the last {time_period} days*\n\n"
                else:
                    output += f"*Data from all resolved complaints*\n\n"
                
                output += f"![Resolution Time Plot](data:image/png;base64,{img_data})\n\n"
                
                output += "This box plot shows complaint resolution times (in days) for each category:\n\n"
                output += "- The **box** represents the middle 50% of resolution times\n"
                output += "- The **horizontal line** inside the box is the median resolution time\n"
                output += "- The **diamond** marker represents the mean resolution time\n"
                output += "- The **dots** represent individual complaints\n"
                output += "- The **red dashed line** shows the overall average resolution time\n\n"
                
                output += "Categories with higher boxes generally take longer to resolve, and wider boxes indicate more variability in resolution times."
                
                return output
            else:
                return img_data  # Error message
                
        except Exception as e:
            return f"Error generating resolution time plot: {str(e)}"

    async def _arun(self, time_period: Optional[int] = None) -> str:
        return self._run(time_period)


def get_chatbot_tools():
    return [
        # Core tools
        SearchComplaintTool(),
        GetComplaintTool(),
        UpdateComplaintStatusTool(),
        GetComplaintStatsByTypeTool(),
        
        # New workflow tools
        AssignComplaintTool(),
        RespondToComplaintTool(),
        BatchUpdateStatusTool(),
        
        # Analytics tools
        GetPriorityQueueTool(),
        GetTrendingTopicsTool(),
        
        # Prediction tools
        PredictCategoryTool(),
        
        # Visualization tools
        StatusDistributionPlotTool(),
        CategoryDistributionPlotTool(),
        UrgencyDistributionPlotTool(),
        TimeTrendPlotTool(),
        CategoryComparisonPlotTool(),
        ResolutionTimePlotTool()
    ]
