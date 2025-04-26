from langchain_core.vectorstores import VectorStore
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_community.document_loaders import DataFrameLoader
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.runnable import RunnableMap
from langchain_core.prompts import ChatPromptTemplate
from langchain.tools import BaseTool
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional, Type
import pandas as pd
import os

from app.core.config import settings
from app.models.domain.complaint import Complaint
from app.db.database import SessionLocal


class ComplaintEmbedding:
    def __init__(self):
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        
        if not settings.GOOGLE_API_KEY:
            raise ValueError("Google API key not set. Please set the GOOGLE_API_KEY environment variable.")
        
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.GOOGLE_API_KEY
        )
        self.vector_store = None
    
    def load_complaints_from_db(self) -> List[Document]:
        db = SessionLocal()
        try:
            complaints = db.query(Complaint).all()
            documents = []
            
            for complaint in complaints:
                metadata = {
                    "id": complaint.id,
                    "category": complaint.category,
                    "urgency": complaint.urgency,
                    "status": complaint.status,
                    "created_at": str(complaint.created_at),
                }
                
                if complaint.response is not None:
                    metadata["response"] = complaint.response
                
                doc = Document(
                    page_content=str(complaint.complaint_text),
                    metadata=metadata
                )
                documents.append(doc)
            
            return documents
        finally:
            db.close()
    
    def create_vector_store(self) -> VectorStore:
        documents = self.load_complaints_from_db()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        self.vector_store = FAISS.from_documents(chunks, self.embeddings)
        return self.vector_store
    
    def get_vector_store(self) -> VectorStore:
        if self.vector_store is None:
            return self.create_vector_store()
        return self.vector_store
    
    def refresh_vector_store(self) -> VectorStore:
        self.vector_store = None
        return self.create_vector_store()
