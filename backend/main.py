from fastapi import FastAPI, Depends, HTTPException, Query, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import shutil

from . import models, schemas, database, ingest
import os

app = FastAPI(title="NHIS Fraud Auditor Dashboard", root_path=os.getenv("ROOT_PATH", ""))

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/ingest")
async def trigger_ingest(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Save the uploaded file
    file_location = "data/uploaded_claims.csv"
    
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # Run ingestion in background to not block the UI
    background_tasks.add_task(ingest.ingest_data, file_location)
    return {"message": "File uploaded and ingestion started"}

@app.get("/stats", response_model=schemas.Stats)
def get_stats(db: Session = Depends(get_db)):
    total_claims = db.query(models.Claim).count()
    if total_claims == 0:
        return schemas.Stats(total_claims=0, average_claim_amount=0, flagged_claims_count=0, flagged_claims_percentage=0)
        
    avg_amount = db.query(models.Claim).with_entities(models.Claim.claim_amount).all()
    avg_amount_val = sum([x[0] for x in avg_amount]) / total_claims
    
    flagged_count = db.query(models.Claim).filter(models.Claim.fraud_score > 75).count()
    
    return schemas.Stats(
        total_claims=total_claims,
        average_claim_amount=round(avg_amount_val, 2),
        flagged_claims_count=flagged_count,
        flagged_claims_percentage=round((flagged_count / total_claims) * 100, 2)
    )

@app.get("/distribution", response_model=schemas.Distribution)
def get_distribution(db: Session = Depends(get_db)):
    low = db.query(models.Claim).filter(models.Claim.fraud_score <= 25).count()
    medium = db.query(models.Claim).filter(models.Claim.fraud_score > 25, models.Claim.fraud_score <= 75).count()
    high = db.query(models.Claim).filter(models.Claim.fraud_score > 75).count()
    
    return schemas.Distribution(low=low, medium=medium, high=high)

@app.get("/claims", response_model=List[schemas.Claim])
def get_claims(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Claim)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Claim.diagnosis_code.ilike(search_term)) | 
            (models.Claim.patient_id.ilike(search_term)) |
            (models.Claim.claim_id.ilike(search_term))
        )
    
    if min_score is not None:
        query = query.filter(models.Claim.fraud_score >= min_score)
    
    if max_score is not None:
        query = query.filter(models.Claim.fraud_score <= max_score)
        
    claims = query.offset(skip).limit(limit).all()
    return claims

@app.put("/claims/{claim_id}", response_model=schemas.Claim)
def update_claim_status(claim_id: str, claim_update: schemas.ClaimUpdate, db: Session = Depends(get_db)):
    db_claim = db.query(models.Claim).filter(models.Claim.claim_id == claim_id).first()
    if not db_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    db_claim.status = claim_update.status
    db.commit()
    db.refresh(db_claim)
    return db_claim

@app.on_event("startup")
def startup_event():
    # Ensure DB tables exist
    models.Base.metadata.create_all(bind=database.engine)
