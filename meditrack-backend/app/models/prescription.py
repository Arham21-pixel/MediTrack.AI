"""
Prescription Model
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class ParsedMedicine(BaseModel):
    """Parsed medicine from prescription"""
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[List[str]] = None
    duration_days: Optional[int] = None
    instructions: Optional[str] = None


class ParsedPrescriptionData(BaseModel):
    """Structured data extracted from prescription"""
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    patient_name: Optional[str] = None
    date: Optional[str] = None
    diagnosis: Optional[str] = None
    medicines: List[ParsedMedicine] = []
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None


class PrescriptionBase(BaseModel):
    """Base prescription model"""
    file_url: Optional[str] = None
    doctor_name: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    """Prescription creation model"""
    user_id: UUID


class PrescriptionInDB(PrescriptionBase):
    """Prescription model as stored in database"""
    id: UUID
    user_id: UUID
    parsed_data: Optional[Dict[str, Any]] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class PrescriptionResponse(PrescriptionBase):
    """Prescription response model"""
    id: UUID
    user_id: UUID
    parsed_data: Optional[ParsedPrescriptionData] = None
    uploaded_at: datetime
    medicines: Optional[List[ParsedMedicine]] = None
    
    class Config:
        from_attributes = True


class PrescriptionUpdate(BaseModel):
    """Prescription update model"""
    doctor_name: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None


class Prescription:
    """Prescription entity class"""
    
    def __init__(
        self,
        id: UUID,
        user_id: UUID,
        file_url: Optional[str] = None,
        parsed_data: Optional[Dict[str, Any]] = None,
        doctor_name: Optional[str] = None,
        uploaded_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.file_url = file_url
        self.parsed_data = parsed_data
        self.doctor_name = doctor_name
        self.uploaded_at = uploaded_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "file_url": self.file_url,
            "parsed_data": self.parsed_data,
            "doctor_name": self.doctor_name,
            "uploaded_at": self.uploaded_at.isoformat()
        }
