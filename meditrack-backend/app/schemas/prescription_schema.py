"""
Prescription Schemas for API validation
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class ParsedMedicineSchema(BaseModel):
    """Schema for parsed medicine data"""
    name: str = Field(..., description="Medicine name")
    dosage: Optional[str] = Field(None, description="Dosage (e.g., '500mg')")
    frequency: Optional[str] = Field(None, description="Frequency (e.g., 'twice daily')")
    timing: Optional[List[str]] = Field(None, description="Timing instructions (e.g., ['morning', 'night'])")
    duration_days: Optional[int] = Field(None, description="Duration in days")
    instructions: Optional[str] = Field(None, description="Additional instructions")


class PrescriptionUploadResponse(BaseModel):
    """Response after uploading prescription"""
    id: UUID
    file_url: str
    message: str = "Prescription uploaded successfully"
    is_processing: bool = True


class PrescriptionParsedData(BaseModel):
    """Parsed prescription data structure"""
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    patient_name: Optional[str] = None
    date: Optional[str] = None
    diagnosis: Optional[str] = None
    medicines: List[ParsedMedicineSchema] = []
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    raw_text: Optional[str] = None


class PrescriptionCreate(BaseModel):
    """Schema for creating prescription"""
    doctor_name: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None


class PrescriptionResponse(BaseModel):
    """Full prescription response"""
    id: UUID
    user_id: UUID
    file_url: Optional[str] = None
    doctor_name: Optional[str] = None
    parsed_data: Optional[PrescriptionParsedData] = None
    uploaded_at: datetime
    medicines_count: int = 0
    
    class Config:
        from_attributes = True


class PrescriptionListResponse(BaseModel):
    """List of prescriptions response"""
    prescriptions: List[PrescriptionResponse]
    total: int
    page: int = 1
    per_page: int = 10


class PrescriptionUpdate(BaseModel):
    """Schema for updating prescription"""
    doctor_name: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None


class OCRResult(BaseModel):
    """OCR processing result"""
    raw_text: str
    confidence: float
    language: str = "en"


class AIParseResult(BaseModel):
    """AI parsing result"""
    parsed_data: PrescriptionParsedData
    confidence: float
    processing_time_ms: int
