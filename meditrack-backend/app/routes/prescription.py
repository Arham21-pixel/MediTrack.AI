"""
Prescription Routes
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from app.routes.auth import get_current_user
from app.database import prescription_db, medicine_db
from app.services.ocr_service import OCRService
from app.services.ai_service import AIService
from app.services.storage_service import StorageService
from app.schemas.prescription_schema import (
    PrescriptionResponse,
    PrescriptionListResponse,
    PrescriptionUploadResponse,
    PrescriptionUpdate,
    PrescriptionParsedData
)

router = APIRouter()

# Initialize services
ocr_service = OCRService()
ai_service = AIService()
storage_service = StorageService()


@router.post("/upload", response_model=PrescriptionUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a prescription image and process with AI
    
    - Uploads the image to storage
    - Extracts text using OCR
    - Parses medicine details using AI
    - Creates medicine entries
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
            folder="prescriptions"
        )
        
        # Create prescription record
        prescription_id = str(uuid4())
        prescription_data = {
            "id": prescription_id,
            "user_id": current_user["id"],
            "file_url": file_url,
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
        await prescription_db.create(prescription_data)
        
        # Process in background (OCR + AI parsing)
        try:
            # Extract text using OCR
            ocr_result = await ocr_service.extract_text(file_content)
            
            # Parse using AI
            parsed_data = await ai_service.parse_prescription(ocr_result["text"])
            
            # Update prescription with parsed data
            await prescription_db.update(prescription_id, {
                "parsed_data": parsed_data,
                "doctor_name": parsed_data.get("doctor_name")
            })
            
            # Create medicine entries
            if parsed_data.get("medicines"):
                for medicine in parsed_data["medicines"]:
                    medicine_id = str(uuid4())
                    medicine_data = {
                        "id": medicine_id,
                        "prescription_id": prescription_id,
                        "name": medicine.get("name"),
                        "dosage": medicine.get("dosage"),
                        "frequency": medicine.get("frequency"),
                        "timing": medicine.get("timing", []),
                        "duration_days": medicine.get("duration_days"),
                        "start_date": datetime.now().date().isoformat(),
                        "instructions": medicine.get("instructions")
                    }
                    
                    # Calculate end date if duration is specified
                    if medicine.get("duration_days"):
                        from datetime import timedelta
                        end_date = datetime.now().date() + timedelta(days=medicine["duration_days"])
                        medicine_data["end_date"] = end_date.isoformat()
                    
                    await medicine_db.create(medicine_data)
                    
        except Exception as e:
            # Log error but don't fail the upload
            print(f"Error processing prescription: {str(e)}")
        
        return PrescriptionUploadResponse(
            id=prescription_id,
            file_url=file_url,
            message="Prescription uploaded and processing started",
            is_processing=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload prescription: {str(e)}"
        )


@router.get("", response_model=PrescriptionListResponse)
async def get_prescriptions(
    page: int = 1,
    per_page: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all prescriptions for the current user
    """
    prescriptions = await prescription_db.get_by_user_id(current_user["id"])
    
    # Sort by upload date (newest first)
    prescriptions.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    
    # Pagination
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated = prescriptions[start_idx:end_idx]
    
    # Format response
    formatted_prescriptions = []
    for p in paginated:
        medicines = await medicine_db.get_by_prescription_id(p["id"])
        formatted_prescriptions.append({
            **p,
            "medicines_count": len(medicines)
        })
    
    return PrescriptionListResponse(
        prescriptions=formatted_prescriptions,
        total=len(prescriptions),
        page=page,
        per_page=per_page
    )


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific prescription by ID
    """
    prescription = await prescription_db.get_by_id(prescription_id)
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    # Verify ownership
    if prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this prescription"
        )
    
    # Get associated medicines
    medicines = await medicine_db.get_by_prescription_id(prescription_id)
    
    return {
        **prescription,
        "medicines_count": len(medicines)
    }


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: str,
    update_data: PrescriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a prescription
    """
    prescription = await prescription_db.get_by_id(prescription_id)
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    # Verify ownership
    if prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this prescription"
        )
    
    # Update prescription
    update_dict = update_data.model_dump(exclude_unset=True)
    if update_dict:
        updated = await prescription_db.update(prescription_id, update_dict)
        if updated:
            prescription.update(update_dict)
    
    medicines = await medicine_db.get_by_prescription_id(prescription_id)
    
    return {
        **prescription,
        "medicines_count": len(medicines)
    }


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a prescription and its associated medicines
    """
    prescription = await prescription_db.get_by_id(prescription_id)
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    # Verify ownership
    if prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this prescription"
        )
    
    # Delete associated medicines first
    medicines = await medicine_db.get_by_prescription_id(prescription_id)
    for medicine in medicines:
        await medicine_db.delete(medicine["id"])
    
    # Delete prescription
    await prescription_db.delete(prescription_id)
    
    # Optionally delete file from storage
    if prescription.get("file_url"):
        try:
            await storage_service.delete_file(prescription["file_url"])
        except Exception:
            pass  # Log but don't fail


@router.post("/{prescription_id}/reprocess")
async def reprocess_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Reprocess a prescription with AI
    """
    prescription = await prescription_db.get_by_id(prescription_id)
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    # Verify ownership
    if prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this prescription"
        )
    
    if not prescription.get("file_url"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file URL found for this prescription"
        )
    
    try:
        # Download file from storage
        file_content = await storage_service.download_file(prescription["file_url"])
        
        # Re-run OCR
        ocr_result = await ocr_service.extract_text(file_content)
        
        # Re-parse with AI
        parsed_data = await ai_service.parse_prescription(ocr_result["text"])
        
        # Update prescription
        await prescription_db.update(prescription_id, {
            "parsed_data": parsed_data,
            "doctor_name": parsed_data.get("doctor_name")
        })
        
        return {
            "message": "Prescription reprocessed successfully",
            "parsed_data": parsed_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reprocess prescription: {str(e)}"
        )
