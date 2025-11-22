import pandas as pd
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import Claim
import os

def ingest_data(csv_path: str):
    """
    Reads a CSV file, calculates fraud scores based on a heuristic,
    and populates the SQLite database.
    
    Heuristic:
    1. Calculate average 'Amount Billed' for each 'DIAGNOSIS'.
    2. Score = (Claim Amount / Average for Diagnosis) * 50.
    3. Cap score at 100.
    """
    print(f"Loading data from {csv_path}...")
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    df = pd.read_csv(csv_path)
    
    # Map CSV columns to model fields
    # CSV: Patient ID,AGE,GENDER,DATE OF ENCOUNTER,DATE OF DISCHARGE,DIAGNOSIS,Amount Billed
    
    # Clean Amount Billed: remove non-numeric chars if any, handle empty strings
    df['Amount Billed'] = pd.to_numeric(df['Amount Billed'], errors='coerce').fillna(0)
    
    print("Calculating fraud scores...")
    # Heuristic: Group by DIAGNOSIS and calculate average Amount Billed
    avg_charges = df.groupby('DIAGNOSIS')['Amount Billed'].transform('mean')
    
    # Calculate score: (Amount / Avg) * 50. 
    scores = (df['Amount Billed'] / avg_charges) * 50
    scores = scores.fillna(0) 
    scores = scores.clip(upper=100)
    df['fraud_score'] = scores.astype(int)
    
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Clear existing data for MVP idempotency
    db.query(Claim).delete()
    db.commit()
    
    print("Inserting data...")
    for idx, row in df.iterrows():
        # Generate a dummy Claim ID since it's not in the CSV
        claim_id = f"CLM-{idx+1:04d}"
        
        # Handle potential missing values
        patient_id = str(row['Patient ID']) if pd.notna(row['Patient ID']) else "UNKNOWN"
        diagnosis = str(row['DIAGNOSIS']) if pd.notna(row['DIAGNOSIS']) else "UNKNOWN"
        age = int(row['AGE']) if pd.notna(row['AGE']) else None
        gender = str(row['GENDER']) if pd.notna(row['GENDER']) else None
        
        # Use 'DATE OF ENCOUNTER' as date
        date_str = str(row['DATE OF ENCOUNTER']) if pd.notna(row['DATE OF ENCOUNTER']) else ""
        
        claim = Claim(
            claim_id=claim_id,
            patient_id=patient_id,
            diagnosis_code=diagnosis,
            age=age,
            gender=gender,
            claim_amount=float(row['Amount Billed']),
            date=date_str,
            fraud_score=int(row['fraud_score'])
        )
        db.add(claim)
    
    db.commit()
    db.close()
    print("Data ingestion complete.")

if __name__ == "__main__":
    # Assuming run from root or backend folder, adjust path
    csv_path = "../data/healthcare_claims.csv"
    if not os.path.exists(csv_path):
        csv_path = "data/healthcare_claims.csv" # Try relative to root if run from root
    
    ingest_data(csv_path)
