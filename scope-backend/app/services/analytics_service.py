from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Dict, List, Any, Tuple
from collections import Counter

from app.models.domain.complaint import Complaint, Category, Urgency


class AnalyticsService:
    @staticmethod
    def get_complaint_trends(db: Session) -> Dict[str, Any]:
        """
        Get complaint trends over time, categorized by type and urgency
        """
        total_complaints = db.query(func.count(Complaint.id)).scalar()
        
        # Count by category
        category_counts = db.query(
            Complaint.category, func.count(Complaint.id)
        ).group_by(Complaint.category).all()
        
        # Count by urgency
        urgency_counts = db.query(
            Complaint.urgency, func.count(Complaint.id)
        ).group_by(Complaint.urgency).all()
        
        # Count by status
        status_counts = db.query(
            Complaint.status, func.count(Complaint.id)
        ).group_by(Complaint.status).all()
        
        return {
            "total_complaints": total_complaints,
            "by_category": {cat: count for cat, count in category_counts},
            "by_urgency": {urg: count for urg, count in urgency_counts},
            "by_status": {status: count for status, count in status_counts}
        }
    
    @staticmethod
    def get_highest_priority_complaints(db: Session, limit: int = 5) -> List[Complaint]:
        """
        Get the highest priority complaints that need attention
        """
        # Define urgency order (Critical > High > Medium > Low)
        urgency_order = {
            "Critical": 1,
            "High": 2, 
            "Medium": 3,
            "Low": 4
        }
        
        # Get pending or in-progress complaints
        open_complaints = db.query(Complaint).filter(
            Complaint.status.in_(["Pending", "In Progress"])
        ).all()
        
        # Sort by urgency
        sorted_complaints = sorted(
            open_complaints,
            key=lambda x: urgency_order.get(str(x.urgency), 999)
        )
        
        return sorted_complaints[:limit]
    
    @staticmethod
    def get_common_topics(db: Session, limit: int = 5) -> List[Tuple[str, int]]:
        """
        Extract common topics from complaint texts using simple word frequency
        """
        from collections import Counter
        import re
        import string
        
        # Get all complaint texts
        complaints = db.query(Complaint.complaint_text).all()
        texts = [c[0] for c in complaints]
        
        # Simple preprocessing
        def preprocess(text):
            # Convert to lowercase and remove punctuation
            text = text.lower()
            text = re.sub(f'[{string.punctuation}]', '', text)
            # Remove common stopwords
            stopwords = {'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 
                         'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 
                         'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 
                         'itself', 'they', 'them', 'their', 'theirs', 'themselves', 
                         'what', 'which', 'who', 'whom', 'this', 'that', 'these', 
                         'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 
                         'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 
                         'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 
                         'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 
                         'against', 'between', 'into', 'through', 'during', 'before', 
                         'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 
                         'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 
                         'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 
                         'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 
                         'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 
                         'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 
                         'now', 'would', 'could', 'please', 'need'}
            return [word for word in text.split() if word not in stopwords and len(word) > 3]
        
        # Process all texts
        all_words = []
        for text in texts:
            all_words.extend(preprocess(text))
        
        # Count word frequency
        word_counts = Counter(all_words)
        
        # Return the most common topics
        return word_counts.most_common(limit)
    
    @staticmethod
    def get_response_time_stats(db: Session) -> Dict[str, Any]:
        """
        Calculate average response times for different categories of complaints
        
        Note: This is a simplified version. In a real implementation, you would 
        track timestamps for status changes.
        """
        # Simplified stats since we don't have actual response time data
        return {
            "average_response_time_days": 1.5,
            "by_urgency": {
                "Critical": 0.5,
                "High": 1.0,
                "Medium": 2.0,
                "Low": 3.0
            }
        }
