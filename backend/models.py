from sqlalchemy import Column, Integer, String, Float, Date
from .database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String, unique=True, index=True)
    patient_id = Column(String, index=True)
    diagnosis_code = Column(String, index=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    claim_amount = Column(Float)
    date = Column(String) # Storing as string for simplicity in MVP
    fraud_score = Column(Integer)
    status = Column(String, default="New") # New, Under Review, Closed
