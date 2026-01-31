"""
Medicine and Medicine Log Models
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel
from uuid import UUID
from enum import Enum


class MedicineStatus(str, Enum):
    """Medicine log status"""
    TAKEN = "taken"
    MISSED = "missed"
    SKIPPED = "skipped"


class MedicineBase(BaseModel):
    """Base medicine model"""
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[List[str]] = None
    duration_days: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None


class MedicineCreate(MedicineBase):
    """Medicine creation model"""
    prescription_id: UUID


class MedicineInDB(MedicineBase):
    """Medicine model as stored in database"""
    id: UUID
    prescription_id: UUID
    
    class Config:
        from_attributes = True


class MedicineResponse(MedicineBase):
    """Medicine response model"""
    id: UUID
    prescription_id: UUID
    is_active: bool = True
    days_remaining: Optional[int] = None
    
    class Config:
        from_attributes = True


class MedicineUpdate(BaseModel):
    """Medicine update model"""
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[List[str]] = None
    duration_days: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None


# Medicine Log Models
class MedicineLogBase(BaseModel):
    """Base medicine log model"""
    scheduled_time: datetime
    status: MedicineStatus


class MedicineLogCreate(MedicineLogBase):
    """Medicine log creation model"""
    medicine_id: UUID


class MedicineLogInDB(MedicineLogBase):
    """Medicine log model as stored in database"""
    id: UUID
    medicine_id: UUID
    taken_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MedicineLogResponse(MedicineLogBase):
    """Medicine log response model"""
    id: UUID
    medicine_id: UUID
    taken_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MedicineLogUpdate(BaseModel):
    """Medicine log update model"""
    status: Optional[MedicineStatus] = None
    taken_at: Optional[datetime] = None


# Adherence Statistics
class AdherenceStats(BaseModel):
    """Medicine adherence statistics"""
    total_doses: int
    taken_doses: int
    missed_doses: int
    skipped_doses: int
    adherence_percentage: float
    streak_days: int
    best_streak: int


class DailyAdherence(BaseModel):
    """Daily adherence data"""
    date: date
    total_scheduled: int
    taken: int
    missed: int
    skipped: int
    percentage: float


class Medicine:
    """Medicine entity class"""
    
    def __init__(
        self,
        id: UUID,
        prescription_id: UUID,
        name: str,
        dosage: Optional[str] = None,
        frequency: Optional[str] = None,
        timing: Optional[List[str]] = None,
        duration_days: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        instructions: Optional[str] = None
    ):
        self.id = id
        self.prescription_id = prescription_id
        self.name = name
        self.dosage = dosage
        self.frequency = frequency
        self.timing = timing or []
        self.duration_days = duration_days
        self.start_date = start_date
        self.end_date = end_date
        self.instructions = instructions
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "prescription_id": str(self.prescription_id),
            "name": self.name,
            "dosage": self.dosage,
            "frequency": self.frequency,
            "timing": self.timing,
            "duration_days": self.duration_days,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "instructions": self.instructions
        }
    
    @property
    def is_active(self) -> bool:
        """Check if medicine is still active"""
        if self.end_date:
            return date.today() <= self.end_date
        return True
    
    @property
    def days_remaining(self) -> Optional[int]:
        """Get days remaining for this medicine"""
        if self.end_date:
            delta = self.end_date - date.today()
            return max(0, delta.days)
        return None


class MedicineLog:
    """Medicine log entity class"""
    
    def __init__(
        self,
        id: UUID,
        medicine_id: UUID,
        scheduled_time: datetime,
        status: MedicineStatus,
        taken_at: Optional[datetime] = None,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.medicine_id = medicine_id
        self.scheduled_time = scheduled_time
        self.status = status
        self.taken_at = taken_at
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "medicine_id": str(self.medicine_id),
            "scheduled_time": self.scheduled_time.isoformat(),
            "status": self.status.value,
            "taken_at": self.taken_at.isoformat() if self.taken_at else None,
            "created_at": self.created_at.isoformat()
        }
