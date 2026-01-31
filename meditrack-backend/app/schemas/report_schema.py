"""
Health Report Schemas for API validation
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
from uuid import UUID
from enum import Enum


class RiskLevelEnum(str, Enum):
    """Risk level classification"""
    NORMAL = "normal"
    WARNING = "warning"
    CRITICAL = "critical"


class ReportTypeEnum(str, Enum):
    """Types of health reports"""
    CBC = "cbc"
    LFT = "lft"
    KFT = "kft"
    LIPID = "lipid"
    THYROID = "thyroid"
    DIABETES = "diabetes"
    URINE = "urine"
    XRAY = "xray"
    MRI = "mri"
    CT_SCAN = "ct_scan"
    ECG = "ecg"
    OTHER = "other"


class LabValueSchema(BaseModel):
    """Individual lab value"""
    name: str = Field(..., description="Lab test name")
    value: float = Field(..., description="Test value")
    unit: str = Field(..., description="Unit of measurement")
    normal_range: Optional[str] = Field(None, description="Normal range (e.g., '4.0-11.0')")
    status: RiskLevelEnum = Field(RiskLevelEnum.NORMAL, description="Value status")
    interpretation: Optional[str] = Field(None, description="Simple interpretation")


class ReportAnalysisSchema(BaseModel):
    """AI-generated report analysis"""
    summary: str = Field(..., description="Brief summary of the report")
    risk_level: RiskLevelEnum = Field(..., description="Overall risk level")
    key_findings: List[str] = Field(default=[], description="Key findings from the report")
    recommendations: List[str] = Field(default=[], description="Recommendations based on findings")
    follow_up_needed: bool = Field(False, description="Whether follow-up is recommended")
    follow_up_date: Optional[str] = Field(None, description="Suggested follow-up date")
    abnormal_values: List[LabValueSchema] = Field(default=[], description="List of abnormal values")


class ReportCreate(BaseModel):
    """Schema for creating health report"""
    report_type: Optional[ReportTypeEnum] = ReportTypeEnum.OTHER


class ReportUploadResponse(BaseModel):
    """Response after uploading report"""
    id: UUID
    file_url: str
    message: str = "Report uploaded successfully"
    is_processing: bool = True


class ReportResponse(BaseModel):
    """Full health report response"""
    id: UUID
    user_id: UUID
    file_url: Optional[str] = None
    report_type: Optional[ReportTypeEnum] = None
    lab_values: Optional[List[LabValueSchema]] = None
    ai_summary: Optional[str] = None
    risk_level: Optional[RiskLevelEnum] = None
    analysis: Optional[ReportAnalysisSchema] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    """List of reports response"""
    reports: List[ReportResponse]
    total: int
    page: int = 1
    per_page: int = 10


class ReportUpdate(BaseModel):
    """Schema for updating health report"""
    report_type: Optional[ReportTypeEnum] = None
    lab_values: Optional[Dict[str, Any]] = None
    ai_summary: Optional[str] = None
    risk_level: Optional[RiskLevelEnum] = None


# Trend Schemas
class TrendDataPoint(BaseModel):
    """Single data point for trend visualization"""
    date: datetime
    value: float
    status: RiskLevelEnum
    report_id: UUID


class TrendResponse(BaseModel):
    """Trend data for a specific lab value"""
    name: str = Field(..., description="Lab test name")
    unit: str = Field(..., description="Unit of measurement")
    normal_range: Optional[str] = None
    data_points: List[TrendDataPoint] = []
    trend_direction: Optional[str] = Field(None, description="'improving', 'worsening', or 'stable'")
    change_percentage: Optional[float] = Field(None, description="Percentage change from first to last")


class MultipleTrendsResponse(BaseModel):
    """Multiple trends response"""
    trends: Dict[str, TrendResponse]
    period_start: datetime
    period_end: datetime


# Common lab test reference ranges
class ReferenceRange(BaseModel):
    """Reference range for lab values"""
    name: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    unit: str
    category: str  # e.g., "CBC", "LFT", "KFT"


# Report comparison
class ReportComparisonItem(BaseModel):
    """Single item in report comparison"""
    name: str
    current_value: float
    previous_value: Optional[float] = None
    unit: str
    change: Optional[float] = None
    change_direction: Optional[str] = None  # "up", "down", "same"
    current_status: RiskLevelEnum
    previous_status: Optional[RiskLevelEnum] = None


class ReportComparisonResponse(BaseModel):
    """Comparison between two reports"""
    current_report_id: UUID
    previous_report_id: Optional[UUID] = None
    current_date: datetime
    previous_date: Optional[datetime] = None
    comparisons: List[ReportComparisonItem]
    overall_improvement: Optional[bool] = None
