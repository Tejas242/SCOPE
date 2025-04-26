import pandas as pd
from sqlalchemy.orm import Session
import os
import sys
import random

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.domain.complaint import Complaint, Category, Urgency


def seed_complaints_from_csv(db: Session, csv_path: str):
    """
    Seed the database with complaints from a CSV file.
    """
    # Read CSV file
    try:
        df = pd.read_csv(csv_path)
        print(f"Loading {len(df)} complaints from {csv_path}")
        
        # Map statuses
        statuses = ["Pending", "In Progress", "Resolved", "Closed"]
        
        for _, row in df.iterrows():
            # Map CSV category and urgency to enum values
            category = row.get('category')
            urgency = row.get('urgency')
            
            # Create complaint instance
            complaint = Complaint(
                complaint_text=row['complaint_text'],
                category=category,
                urgency=urgency,
                status=random.choice(statuses),
                assigned_to=None if random.random() > 0.7 else f"staff-{random.randint(1, 5)}@university.edu"
            )
            
            db.add(complaint)
        
        db.commit()
        print(f"Successfully loaded {len(df)} complaints from CSV")
    except Exception as e:
        print(f"Error loading complaints from CSV: {str(e)}")
        db.rollback()


if __name__ == "__main__":
    db = SessionLocal()
    
    # Specify the CSV file to use
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "data/complaints-small.csv"
    
    # Seed the database with sample data
    seed_complaints_from_csv(db, csv_file)
