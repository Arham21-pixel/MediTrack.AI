"""
Medicine Schemas for API validation
"""
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from uuid import UUID
from enum import Enum


class MedicineStatusEnum(str, Enum):
    """Medicine intake status"""
    TAKEN = "taken"
    MISSED = "missed"
    SKIPPED = "skipped"


class MedicineCreate(BaseModel):
    """Schema for creating medicine"""
    prescription_id: UUID
    name: str = Field(..., description="Medicine name")
    dosage: Optional[str] = Field(None, description="Dosage (e.g., '500mg')")
    frequency: Optional[str] = Field(None, description="Frequency (e.g., 'twice daily')")
    timing: Optional[List[str]] = Field(default=[], description="Timing (e.g., ['morning', 'night'])")
    duration_days: Optional[int] = Field(None, description="Duration in days")
    start_date: Optional[date] = Field(None, description="Start date")
    end_date: Optional[date] = Field(None, description="End date")
    instructions: Optional[str] = Field(None, description="Additional instructions")


class MedicineResponse(BaseModel):
    """Medicine response schema"""
    id: UUID
    prescription_id: UUID
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[List[str]] = []
    duration_days: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    is_active: bool = True
    days_remaining: Optional[int] = None
    
    class Config:
        from_attributes = True


class MedicineUpdate(BaseModel):
    """Schema for updating medicine"""
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[List[str]] = None
    duration_days: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None


class MedicineListResponse(BaseModel):
    """List of medicines response"""
    medicines: List[MedicineResponse]
    total: int
    active_count: int


# Medicine Log Schemas
class MedicineLogCreate(BaseModel):
    """Schema for creating medicine log"""
    medicine_id: UUID
    scheduled_time: datetime
    status: MedicineStatusEnum = MedicineStatusEnum.TAKEN
    taken_at: Optional[datetime] = None


class MedicineLogResponse(BaseModel):
    """Medicine log response schema"""
    id: UUID
    medicine_id: UUID
    scheduled_time: datetime
    status: MedicineStatusEnum
    taken_at: Optional[datetime] = None
    created_at: datetime
    medicine_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class MedicineLogUpdate(BaseModel):
    """Schema for updating medicine log"""
    status: Optional[MedicineStatusEnum] = None
    taken_at: Optional[datetime] = None


class MarkTakenRequest(BaseModel):
    """Request to mark medicine as taken"""
    taken_at: Optional[datetime] = Field(None, description="Time when taken (defaults to now)")
    notes: Optional[str] = Field(None, description="Optional notes")


class MarkMissedRequest(BaseModel):
    """Request to mark medicine as missed"""
    reason: Optional[str] = Field(None, description="Reason for missing")


# Adherence Statistics Schemas
class AdherenceStatsResponse(BaseModel):
    """Adherence statistics response"""
    total_doses: int
    taken_doses: int
    missed_doses: int
    skipped_doses: int
    adherence_percentage: float = Field(..., ge=0, le=100)
    current_streak: int
    best_streak: int
    period_start: date
    period_end: date


class DailyAdherenceData(BaseModel):
    """Daily adherence data point"""
    date: date
    total_scheduled: int
    taken: int
    missed: int
    skipped: int
    percentage: float


class WeeklyAdherenceResponse(BaseModel):
    """Weekly adherence breakdown"""
    data: List[DailyAdherenceData]
    week_start: date
    week_end: date
    overall_percentage: float


class MedicineScheduleItem(BaseModel):
    """Single scheduled medicine item"""
    medicine_id: UUID
    medicine_name: str
    dosage: Optional[str] = None
    scheduled_time: datetime
    timing: str  # e.g., "morning", "afternoon", "night"
    status: Optional[MedicineStatusEnum] = None
    is_overdue: bool = False


class TodayScheduleResponse(BaseModel):
    """Today's medicine schedule"""
    date: date
    schedule: List[MedicineScheduleItem]
    total_medicines: int
    completed: int
    pending: int
