from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from collections import Counter
import re
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA, LatentDirichletAllocation
from sklearn.preprocessing import StandardScaler
from sentence_transformers import SentenceTransformer
from fastapi import HTTPException

from app.models.domain.complaint import Complaint, Category, Urgency


class EdaService:
    @staticmethod
    def get_basic_stats(db: Session) -> Dict[str, Any]:
        """Get basic statistics about complaints."""
        # Get complaints from database
        complaints = db.query(Complaint).all()
        
        # Convert to DataFrame for easier analysis
        data = []
        for c in complaints:
            data.append({
                "id": c.id,
                "text": c.complaint_text,
                "category": str(c.category),
                "urgency": str(c.urgency),
                "status": c.status,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "assigned_to": c.assigned_to,
                "has_response": c.response is not None
            })
        
        df = pd.DataFrame(data)
        
        # Handle empty dataframe case
        if df.empty:
            return {
                "total_complaints": 0,
                "by_category": {},
                "by_urgency": {},
                "by_status": {},
                "response_rate": 0,
                "assigned_rate": 0
            }
        
        # Calculate basic stats
        stats = {
            "total_complaints": len(complaints),
            "by_category": df["category"].value_counts().to_dict(),
            "by_urgency": df["urgency"].value_counts().to_dict(),
            "by_status": df["status"].value_counts().to_dict(),
            "response_rate": (df["has_response"].sum() / len(df)) * 100,
            "assigned_rate": (df["assigned_to"].notna().sum() / len(df)) * 100
        }
        
        return stats
    
    @staticmethod
    def get_time_trends(db: Session) -> Dict[str, Any]:
        """Get time series data for visualizing complaint trends."""
        # Get complaints from database
        complaints = db.query(Complaint).all()
        
        # Convert to DataFrame for time-based analysis
        data = []
        for c in complaints:
            data.append({
                "id": c.id,
                "category": str(c.category),
                "urgency": str(c.urgency),
                "status": c.status,
                "created_at": c.created_at
            })
        
        df = pd.DataFrame(data)
        
        # Add date columns for grouping
        if not df.empty:
            df["date"] = pd.to_datetime(df["created_at"]).dt.date
            df["month"] = pd.to_datetime(df["created_at"]).dt.strftime("%Y-%m")
        
            # Daily counts
            daily_counts = df.groupby("date").size().reset_index(name="count")
            daily_data = {
                "dates": [str(date) for date in daily_counts["date"]],
                "counts": daily_counts["count"].tolist()
            }
            
            # Monthly counts by category
            monthly_category = df.groupby(["month", "category"]).size().reset_index(name="count")
            
            # Format for recharts
            monthly_data = []
            for month in sorted(df["month"].unique()):
                month_data = {"month": month}
                for cat in df["category"].unique():
                    count = monthly_category[(monthly_category["month"] == month) & 
                                          (monthly_category["category"] == cat)]["count"].sum()
                    month_data[cat] = int(count)
                monthly_data.append(month_data)
            
            return {
                "daily_counts": daily_data,
                "monthly_by_category": monthly_data,
                "categories": sorted(df["category"].unique())
            }
        
        return {
            "daily_counts": {"dates": [], "counts": []},
            "monthly_by_category": [],
            "categories": []
        }
    
    @staticmethod
    def get_category_relationships(db: Session) -> Dict[str, Any]:
        """Get cross-tabulations between categories, urgency levels, and statuses."""
        # Get complaints from database
        complaints = db.query(Complaint).all()
        
        # Convert to DataFrame
        data = []
        for c in complaints:
            data.append({
                "category": str(c.category),
                "urgency": str(c.urgency),
                "status": c.status
            })
        
        df = pd.DataFrame(data)
        
        if not df.empty:
            # Create crosstabs
            cat_urgency = pd.crosstab(df["category"], df["urgency"])
            cat_status = pd.crosstab(df["category"], df["status"])
            
            return {
                "category_urgency": {
                    "categories": cat_urgency.index.tolist(),
                    "urgency_levels": cat_urgency.columns.tolist(),
                    "data": cat_urgency.values.tolist()
                },
                "category_status": {
                    "categories": cat_status.index.tolist(),
                    "statuses": cat_status.columns.tolist(),
                    "data": cat_status.values.tolist()
                }
            }
        
        return {
            "category_urgency": {"categories": [], "urgency_levels": [], "data": []},
            "category_status": {"categories": [], "statuses": [], "data": []}
        }
    
    @staticmethod
    def get_word_frequency(db: Session, limit: int = 30) -> List[Dict[str, Any]]:
        """Get the most frequent words from complaint texts."""
        # Get complaint texts
        complaints = db.query(Complaint.complaint_text).all()
        texts = [c[0] for c in complaints]
        
        if not texts:
            return []
        
        # Combine texts
        all_text = " ".join(texts)
        
        # Simple preprocessing
        all_text = all_text.lower()
        all_text = re.sub(r'[^\w\s]', '', all_text)
        
        # Remove common stopwords
        stopwords = {'the', 'and', 'to', 'of', 'is', 'in', 'it', 'that', 'was', 'for', 
                    'on', 'are', 'with', 'as', 'this', 'be', 'have', 'am', 'at', 'by',
                    'not', 'but', 'or', 'from', 'my', 'an', 'so', 'we', 'can'}
        
        words = [word for word in all_text.split() if word not in stopwords and len(word) > 2]
        
        # Count word frequency
        word_counts = Counter(words)
        
        # Get the most common words
        common_words = word_counts.most_common(limit)
        
        return [{"word": word, "count": count} for word, count in common_words]
    
    @staticmethod
    def cluster_complaints(db: Session, n_clusters: int = 5) -> Dict[str, Any]:
        """Cluster complaints based on their content using NLP techniques."""
        # Get complaints
        complaints = db.query(Complaint).all()
        
        if len(complaints) < n_clusters:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough complaints to create {n_clusters} clusters. Have {len(complaints)}, need at least {n_clusters}."
            )
        
        # Extract texts and metadata
        texts = [str(c.complaint_text) for c in complaints]
        ids = [c.id for c in complaints]
        categories = [str(c.category) for c in complaints]
        urgencies = [str(c.urgency) for c in complaints]
        
        try:
            # Use sentence transformers for better embeddings
            model = SentenceTransformer('all-MiniLM-L6-v2')
            embeddings = model.encode(texts)
        except Exception:
            # Fall back to TF-IDF if sentence transformers fails
            vectorizer = TfidfVectorizer(max_features=100)
            embeddings = vectorizer.fit_transform(texts).toarray()
        
        # Scale embeddings
        scaler = StandardScaler()
        scaled_embeddings = scaler.fit_transform(embeddings)
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(scaled_embeddings)
        
        # Reduce dimensions for visualization
        pca = PCA(n_components=2)
        coords = pca.fit_transform(scaled_embeddings)
        
        # Prepare result
        result = {
            "complaint_ids": ids,
            "categories": categories,
            "urgencies": urgencies,
            "cluster_labels": clusters.tolist(),
            "coordinates": {
                "x": coords[:, 0].tolist(),
                "y": coords[:, 1].tolist()
            }
        }
        
        # Add cluster insights
        cluster_insights = {}
        for i in range(n_clusters):
            cluster_indices = [j for j, label in enumerate(clusters) if label == i]
            cluster_texts = [texts[j] for j in cluster_indices]
            
            if cluster_texts:
                # Get sample complaints from this cluster
                samples = cluster_texts[:min(3, len(cluster_texts))]
                
                # Get most common categories in this cluster
                cluster_categories = [categories[j] for j in cluster_indices]
                category_counts = Counter(cluster_categories).most_common()
                
                cluster_insights[str(i)] = {
                    "size": len(cluster_texts),
                    "top_category": category_counts[0][0] if category_counts else "Unknown",
                    "samples": samples
                }
        
        result["cluster_insights"] = cluster_insights
        
        return result
    
    @staticmethod
    def get_topics(db: Session, n_topics: int = 5, n_words: int = 10) -> Dict[str, Any]:
        """Extract topics from complaint texts using Latent Dirichlet Allocation (LDA)."""
        # Get complaints
        complaints = db.query(Complaint).all()
        
        if len(complaints) < n_topics:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough complaints to extract {n_topics} topics. Have {len(complaints)}, need at least {n_topics}."
            )
        
        # Extract texts and metadata
        texts = [str(c.complaint_text) for c in complaints]
        ids = [c.id for c in complaints]
        
        # Text preprocessing
        preprocessed_texts = []
        for text in texts:
            # Convert to lowercase
            text = text.lower()
            # Remove special characters and numbers
            text = re.sub(r'[^\w\s]', '', text)
            text = re.sub(r'\d+', '', text)
            # Remove extra whitespace
            text = ' '.join(text.split())
            
            preprocessed_texts.append(text)
        
        # Create document-term matrix
        vectorizer = CountVectorizer(
            max_df=0.95,  # Ignore terms that appear in >95% of documents
            min_df=2,     # Ignore terms that appear in fewer than 2 documents
            stop_words='english',
            max_features=1000
        )
        
        dtm = vectorizer.fit_transform(preprocessed_texts)
        feature_names = vectorizer.get_feature_names_out()
        
        # Train LDA model
        lda = LatentDirichletAllocation(
            n_components=n_topics,
            random_state=42,
            max_iter=25
        )
        
        # Transform documents to topic space
        topic_distributions = lda.fit_transform(dtm)
        
        # Get topics and their top words
        topics = []
        for topic_idx, topic in enumerate(lda.components_):
            # Get the top words for this topic
            top_words_idx = topic.argsort()[:-n_words-1:-1]
            top_words = [feature_names[i] for i in top_words_idx]
            
            # Get the documents most associated with this topic
            topic_docs = []
            for doc_idx, dist in enumerate(topic_distributions):
                if topic_idx == dist.argmax():
                    topic_docs.append({
                        "id": ids[doc_idx],
                        "text": texts[doc_idx][:100] + "..." if len(texts[doc_idx]) > 100 else texts[doc_idx],
                        "score": float(dist[topic_idx])
                    })
            
            # Sort documents by topic relevance
            topic_docs = sorted(topic_docs, key=lambda x: x["score"], reverse=True)[:5]
            
            topics.append({
                "id": topic_idx,
                "top_words": top_words,
                "documents": topic_docs,
                "weight": float(topic.sum() / lda.components_.sum())  # Topic weight in the corpus
            })
        
        # Sort topics by weight
        topics = sorted(topics, key=lambda x: x["weight"], reverse=True)
        
        # Create topic distribution data for visualization
        document_topics = []
        for i, doc_dist in enumerate(topic_distributions):
            # Get top 2 topics for each document
            top_topics = doc_dist.argsort()[:-3:-1]
            document_topics.append({
                "id": ids[i],
                "text": texts[i][:50] + "..." if len(texts[i]) > 50 else texts[i],
                "topics": [{
                    "id": int(topic_idx),
                    "score": float(doc_dist[topic_idx])
                } for topic_idx in top_topics]
            })
        
        result = {
            "topics": topics,
            "document_topics": document_topics,
            "topic_term_matrix": lda.components_.tolist()
        }
        
        return result
