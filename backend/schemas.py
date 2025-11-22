from pydantic import BaseModel
from typing import Optional

class ClaimBase(BaseModel):
    claim_id: str
    patient_id: str
    diagnosis_code: str
    age: Optional[int] = None
    gender: Optional[str] = None
    claim_amount: float
    date: str
    fraud_score: int
    status: str = "New"

class ClaimUpdate(BaseModel):
    status: str

class Claim(ClaimBase):
    id: int

    class Config:
        from_attributes = True

class Stats(BaseModel):
    total_claims: int
    average_claim_amount: float
    flagged_claims_count: int
    flagged_claims_percentage: float

class Distribution(BaseModel):
    low: int
    medium: int
    high: int
