"""
Health Report Model
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level classification"""
    NORMAL = "normal"
    WARNING = "warning"
    CRITICAL = "critical"


class ReportType(str, Enum):
    """Types of health reports"""
    CBC = "cbc"  # Complete Blood Count
    LFT = "lft"  # Liver Function Test
    KFT = "kft"  # Kidney Function Test
    LIPID = "lipid"  # Lipid Profile
    THYROID = "thyroid"
    DIABETES = "diabetes"
    URINE = "urine"
    XRAY = "xray"
    MRI = "mri"
    CT_SCAN = "ct_scan"
    ECG = "ecg"
    OTHER = "other"


class LabValue(BaseModel):
    """Individual lab value"""
    name: str
    value: float
    unit: str
    normal_range: Optional[str] = None
    status: RiskLevel = RiskLevel.NORMAL
    interpretation: Optional[str] = None


class ReportAnalysis(BaseModel):
    """AI-generated report analysis"""
    summary: str
    risk_level: RiskLevel
    key_findings: List[str] = []
    recommendations: List[str] = []
    follow_up_needed: bool = False
    follow_up_date: Optional[str] = None


class HealthReportBase(BaseModel):
    """Base health report model"""
    file_url: Optional[str] = None
    report_type: Optional[ReportType] = ReportType.OTHER


class HealthReportCreate(HealthReportBase):
    """Health report creation model"""
    user_id: UUID


class HealthReportInDB(HealthReportBase):
    """Health report model as stored in database"""
    id: UUID
    user_id: UUID
    lab_values: Optional[Dict[str, Any]] = None
    ai_summary: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class HealthReportResponse(HealthReportBase):
    """Health report response model"""
    id: UUID
    user_id: UUID
    lab_values: Optional[List[LabValue]] = None
    ai_summary: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    analysis: Optional[ReportAnalysis] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class HealthReportUpdate(BaseModel):
    """Health report update model"""
    report_type: Optional[ReportType] = None
    lab_values: Optional[Dict[str, Any]] = None
    ai_summary: Optional[str] = None
    risk_level: Optional[RiskLevel] = None


class TrendDataPoint(BaseModel):
    """Single data point for trend chart"""
    date: datetime
    value: float
    status: RiskLevel


class TrendData(BaseModel):
    """Trend data for a specific lab value"""
    name: str
    unit: str
    normal_range: Optional[str] = None
    data_points: List[TrendDataPoint] = []
    trend_direction: Optional[str] = None  # "improving", "worsening", "stable"


class HealthReport:
    """Health report entity class"""
    
    def __init__(
        self,
        id: UUID,
        user_id: UUID,
        file_url: Optional[str] = None,
        report_type: Optional[ReportType] = ReportType.OTHER,
        lab_values: Optional[Dict[str, Any]] = None,
        ai_summary: Optional[str] = None,
        risk_level: Optional[RiskLevel] = None,
        uploaded_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.file_url = file_url
        self.report_type = report_type
        self.lab_values = lab_values or {}
        self.ai_summary = ai_summary
        self.risk_level = risk_level
        self.uploaded_at = uploaded_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "file_url": self.file_url,
            "report_type": self.report_type.value if self.report_type else None,
            "lab_values": self.lab_values,
            "ai_summary": self.ai_summary,
            "risk_level": self.risk_level.value if self.risk_level else None,
            "uploaded_at": self.uploaded_at.isoformat()
        }
    
    def get_abnormal_values(self) -> List[Dict[str, Any]]:
        """Get list of abnormal lab values"""
        abnormal = []
        if self.lab_values:
            for key, value in self.lab_values.items():
                if isinstance(value, dict) and value.get("status") != "normal":
                    abnormal.append({
                        "name": key,
                        **value
                    })
        return abnormal
