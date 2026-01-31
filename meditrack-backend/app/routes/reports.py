"""
Health Reports Routes
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from app.routes.auth import get_current_user
from app.database import health_report_db
from app.services.ocr_service import OCRService
from app.services.ai_service import AIService
from app.services.storage_service import StorageService
from app.schemas.report_schema import (
    ReportResponse,
    ReportListResponse,
    ReportUploadResponse,
    ReportUpdate,
    TrendResponse,
    MultipleTrendsResponse,
    ReportTypeEnum,
    RiskLevelEnum
)

router = APIRouter()

# Initialize services
ocr_service = OCRService()
ai_service = AIService()
storage_service = StorageService()


@router.post("/upload", response_model=ReportUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    file: UploadFile = File(...),
    report_type: Optional[ReportTypeEnum] = ReportTypeEnum.OTHER,
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a health report and analyze with AI
    
    - Uploads the report to storage
    - Extracts text/data using OCR
    - Analyzes lab values using AI
    - Classifies risk levels
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to storage
        file_url = await storage_service.upload_file(
            file_content=file_content,
            filename=file.filename,
            content_type=file.content_type,
            folder="reports"
        )
        
        # Create report record
        report_id = str(uuid4())
        report_data = {
            "id": report_id,
            "user_id": current_user["id"],
            "file_url": file_url,
            "report_type": report_type.value if report_type else "other",
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
        await health_report_db.create(report_data)
        
        # Process with AI
        try:
            # Extract text using OCR
            ocr_result = await ocr_service.extract_text(file_content)
            
            # Analyze report using AI
            analysis = await ai_service.analyze_health_report(
                ocr_result["text"],
                report_type.value if report_type else "other"
            )
            
            # Update report with analysis
            await health_report_db.update(report_id, {
                "lab_values": analysis.get("lab_values"),
                "ai_summary": analysis.get("summary"),
                "risk_level": analysis.get("risk_level", "normal")
            })
            
        except Exception as e:
            print(f"Error analyzing report: {str(e)}")
        
        return ReportUploadResponse(
            id=report_id,
            file_url=file_url,
            message="Report uploaded and analysis started",
            is_processing=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload report: {str(e)}"
        )


@router.get("", response_model=ReportListResponse)
async def get_reports(
    page: int = 1,
    per_page: int = 10,
    report_type: Optional[ReportTypeEnum] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all health reports for the current user
    """
    reports = await health_report_db.get_by_user_id(current_user["id"])
    
    # Filter by report type if specified
    if report_type:
        reports = [r for r in reports if r.get("report_type") == report_type.value]
    
    # Sort by upload date (newest first)
    reports.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    
    # Pagination
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated = reports[start_idx:end_idx]
    
    return ReportListResponse(
        reports=paginated,
        total=len(reports),
        page=page,
        per_page=per_page
    )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific health report by ID
    """
    report = await health_report_db.get_by_id(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Verify ownership
    if report["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report"
        )
    
    return report


@router.get("/{report_id}/trends", response_model=TrendResponse)
async def get_report_trends(
    report_id: str,
    lab_value_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get trend data for a specific lab value across all reports
    """
    # Verify the report exists and belongs to user
    report = await health_report_db.get_by_id(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    if report["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report"
        )
    
    # Get all reports for user
    all_reports = await health_report_db.get_by_user_id(current_user["id"])
    
    # Filter by same report type
    same_type_reports = [
        r for r in all_reports 
        if r.get("report_type") == report.get("report_type")
    ]
    
    # Sort by date
    same_type_reports.sort(key=lambda x: x.get("uploaded_at", ""))
    
    # Build trend data
    data_points = []
    for r in same_type_reports:
        lab_values = r.get("lab_values", {})
        if lab_value_name and lab_value_name in lab_values:
            value_data = lab_values[lab_value_name]
            data_points.append({
                "date": r.get("uploaded_at"),
                "value": value_data.get("value", 0),
                "status": value_data.get("status", "normal"),
                "report_id": r["id"]
            })
    
    # Determine trend direction
    trend_direction = "stable"
    if len(data_points) >= 2:
        first_value = data_points[0]["value"]
        last_value = data_points[-1]["value"]
        if last_value > first_value * 1.1:
            trend_direction = "worsening"
        elif last_value < first_value * 0.9:
            trend_direction = "improving"
    
    return TrendResponse(
        name=lab_value_name or "Unknown",
        unit="",
        data_points=data_points,
        trend_direction=trend_direction
    )


@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: str,
    update_data: ReportUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a health report
    """
    report = await health_report_db.get_by_id(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Verify ownership
    if report["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this report"
        )
    
    # Update report
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Convert enums to values
    if "report_type" in update_dict and update_dict["report_type"]:
        update_dict["report_type"] = update_dict["report_type"].value
    if "risk_level" in update_dict and update_dict["risk_level"]:
        update_dict["risk_level"] = update_dict["risk_level"].value
    
    if update_dict:
        updated = await health_report_db.update(report_id, update_dict)
        if updated:
            report.update(update_dict)
    
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a health report
    """
    report = await health_report_db.get_by_id(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Verify ownership
    if report["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this report"
        )
    
    # Delete report
    await health_report_db.delete(report_id)
    
    # Optionally delete file from storage
    if report.get("file_url"):
        try:
            await storage_service.delete_file(report["file_url"])
        except Exception:
            pass


@router.post("/{report_id}/reanalyze")
async def reanalyze_report(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Reanalyze a health report with AI
    """
    report = await health_report_db.get_by_id(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Verify ownership
    if report["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report"
        )
    
    if not report.get("file_url"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file URL found for this report"
        )
    
    try:
        # Download file
        file_content = await storage_service.download_file(report["file_url"])
        
        # Re-run OCR
        ocr_result = await ocr_service.extract_text(file_content)
        
        # Re-analyze with AI
        analysis = await ai_service.analyze_health_report(
            ocr_result["text"],
            report.get("report_type", "other")
        )
        
        # Update report
        await health_report_db.update(report_id, {
            "lab_values": analysis.get("lab_values"),
            "ai_summary": analysis.get("summary"),
            "risk_level": analysis.get("risk_level", "normal")
        })
        
        return {
            "message": "Report reanalyzed successfully",
            "analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reanalyze report: {str(e)}"
        )


@router.get("/summary/all")
async def get_reports_summary(current_user: dict = Depends(get_current_user)):
    """
    Get a summary of all health reports
    """
    reports = await health_report_db.get_by_user_id(current_user["id"])
    
    # Count by type
    type_counts = {}
    risk_counts = {"normal": 0, "warning": 0, "critical": 0}
    
    for report in reports:
        report_type = report.get("report_type", "other")
        type_counts[report_type] = type_counts.get(report_type, 0) + 1
        
        risk_level = report.get("risk_level", "normal")
        if risk_level in risk_counts:
            risk_counts[risk_level] += 1
    
    return {
        "total_reports": len(reports),
        "by_type": type_counts,
        "by_risk_level": risk_counts,
        "latest_report": reports[0] if reports else None
    }
