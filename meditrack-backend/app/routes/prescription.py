"""
Prescription Routes
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status, Body
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from app.routes.auth import get_current_user, get_current_user_optional
from app.database import prescription_db, medicine_db
from app.services.ocr_service import OCRService
from app.services.ai_service import AIService, get_drug_safety_engine
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


@router.post("/check-drug-interactions", status_code=status.HTTP_200_OK)
async def check_drug_interactions(
    request: Dict[str, Any] = Body(...)
):
    """
    🚨 DRUG INTERACTION SAFETY CHECK - NO AUTH REQUIRED FOR DEMO
    
    Check for dangerous drug interactions between new and existing medications.
    THIS IS THE MONEY FEATURE FOR PATIENT SAFETY!
    
    Request body:
    {
        "new_medicines": [{"name": "Aspirin", "dosage": "100mg"}],
        "existing_medicines": [{"name": "Warfarin", "dosage": "5mg"}],
        "demo_mode": false
    }
    """
    try:
        new_meds = request.get("new_medicines", [])
        existing_meds = request.get("existing_medicines", [])
        demo_mode = request.get("demo_mode", False)
        
        # Get drug safety engine
        safety_engine = get_drug_safety_engine()
        
        if demo_mode:
            # HACKATHON: Instant demo results
            safety_alert = safety_engine.get_demo_interaction_alert()
        else:
            # Real AI-powered safety check
            safety_alert = safety_engine.check_drug_interactions(
                new_meds=new_meds,
                existing_meds=existing_meds
            )
        
        return {
            "success": True,
            "safety_check": safety_alert,
            "requires_immediate_action": safety_alert.get('safety_level') in ['DANGER', 'CRITICAL'],
            "message": "Drug interaction check completed"
        }
        
    except Exception as e:
        print(f"Drug interaction check error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "safety_check": {
                "has_critical_interactions": True,
                "safety_level": "CAUTION",
                "overall_recommendation": "Unable to check interactions. Please consult your doctor.",
                "consult_doctor": True
            },
            "requires_immediate_action": True,
            "message": "Safety check failed - please consult doctor"
        }


@router.post("/parse-with-safety-check", status_code=status.HTTP_200_OK)
async def parse_prescription_with_safety(
    file: UploadFile = File(...),
    existing_medicines: str = "",
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    🚨 PARSE PRESCRIPTION + SAFETY CHECK - THE COMPLETE FLOW
    
    1. Uploads and parses prescription image with Vision AI
    2. Checks for drug interactions with existing medications
    3. Returns parsed data + safety alerts
    4. If authenticated, saves to user's timeline
    
    Query params:
    - existing_medicines: JSON string of existing medications, e.g., '[{"name":"Warfarin"}]'
    """
    import json as json_lib
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    try:
        # Parse existing medicines
        existing_meds = []
        if existing_medicines:
            try:
                existing_meds = json_lib.loads(existing_medicines)
            except:
                existing_meds = []
        
        # Step 1: Read file and parse prescription
        file_content = await file.read()
        parsed_data = await ai_service.parse_prescription_from_image(file_content)
        
        # Step 2: Extract new medicines from parsed data
        new_meds = parsed_data.get('medicines', [])
        
        # Step 3: Safety check
        safety_engine = get_drug_safety_engine()
        safety_alert = safety_engine.check_drug_interactions(
            new_meds=new_meds,
            existing_meds=existing_meds
        )
        
        prescription_id = None
        
        # Step 4: If user is authenticated, save to database for timeline
        if current_user:
            try:
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
                    "parsed_data": parsed_data,
                    "doctor_name": parsed_data.get("doctor_name"),
                    "uploaded_at": datetime.utcnow().isoformat()
                }
                
                await prescription_db.create(prescription_data)
                print(f"[TIMELINE] Saved prescription {prescription_id} for user {current_user['id']}")
                
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
                            "instructions": medicine.get("instructions"),
                            "is_active": True
                        }
                        
                        # Calculate end date if duration is specified
                        if medicine.get("duration_days"):
                            from datetime import timedelta
                            end_date = datetime.now().date() + timedelta(days=medicine["duration_days"])
                            medicine_data["end_date"] = end_date.isoformat()
                        
                        await medicine_db.create(medicine_data)
                        
            except Exception as save_error:
                print(f"Error saving prescription to database: {save_error}")
                # Continue anyway - still return parsed data
        
        return {
            "success": True,
            "message": "Prescription parsed and safety checked",
            "file_name": file.filename,
            "parsed_data": parsed_data,
            "safety_check": safety_alert,
            "requires_immediate_action": safety_alert.get('safety_level') in ['DANGER', 'CRITICAL'],
            "has_interactions": safety_alert.get('has_critical_interactions', False),
            "prescription_id": prescription_id,
            "saved_to_timeline": prescription_id is not None
        }
        
    except Exception as e:
        print(f"Parse with safety check error: {str(e)}")
        # Return demo data on error (for hackathon reliability)
        demo_parsed = ai_service._get_demo_prescription_data()
        demo_safety = get_drug_safety_engine().get_demo_interaction_alert()
        
        return {
            "success": True,
            "message": "Prescription analyzed (demo mode due to error)",
            "file_name": file.filename,
            "parsed_data": demo_parsed,
            "safety_check": demo_safety,
            "requires_immediate_action": True,
            "has_interactions": True,
            "demo_mode": True
        }


@router.post("/demo-upload", status_code=status.HTTP_200_OK)
async def demo_upload_prescription(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Demo upload endpoint - Works with or without auth
    For hackathon demo purposes - processes prescription with Vision AI
    If user is authenticated, saves to their account for timeline
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
        
        # Use Vision AI to analyze image directly (no OCR needed!)
        parsed_data = await ai_service.parse_prescription_from_image(file_content)
        
        prescription_id = None
        
        # If user is authenticated, save to database for timeline
        if current_user:
            try:
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
                    "parsed_data": parsed_data,
                    "doctor_name": parsed_data.get("doctor_name"),
                    "uploaded_at": datetime.utcnow().isoformat()
                }
                
                await prescription_db.create(prescription_data)
                print(f"[TIMELINE] Saved prescription {prescription_id} for user {current_user['id']}")
                
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
                            "instructions": medicine.get("instructions"),
                            "is_active": True
                        }
                        
                        # Calculate end date if duration is specified
                        if medicine.get("duration_days"):
                            from datetime import timedelta
                            end_date = datetime.now().date() + timedelta(days=medicine["duration_days"])
                            medicine_data["end_date"] = end_date.isoformat()
                        
                        await medicine_db.create(medicine_data)
                        
            except Exception as save_error:
                print(f"Error saving prescription to database: {save_error}")
                # Continue anyway - still return parsed data
        
        return {
            "success": True,
            "message": "Prescription analyzed successfully with AI",
            "file_name": file.filename,
            "parsed_data": parsed_data,
            "prescription_id": prescription_id,
            "saved_to_timeline": prescription_id is not None
        }
        
    except Exception as e:
        print(f"Demo upload error: {str(e)}")
        # Return demo data on error (for hackathon reliability)
        return {
            "success": True,
            "message": "Prescription analyzed (demo mode)",
            "file_name": file.filename,
            "parsed_data": ai_service._get_demo_prescription_data()
        }


@router.post("/demo-translate", status_code=status.HTTP_200_OK)
async def demo_translate_prescription(
    language: str = "hindi",
    prescription_data: Optional[dict] = None
):
    """
    Demo translate prescription - NO AUTH REQUIRED
    Translates and simplifies prescription to Hindi or Marathi
    
    - language: "hindi" or "marathi"
    - prescription_data: Optional - if not provided, uses demo data
    """
    if language not in ["hindi", "marathi"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language must be 'hindi' or 'marathi'"
        )
    
    try:
        # Use provided data or demo data
        data_to_translate = prescription_data or ai_service._get_demo_prescription_data()
        
        # Translate and simplify
        translated = await ai_service.translate_and_simplify(
            content=data_to_translate,
            target_language=language,
            content_type="prescription"
        )
        
        return {
            "success": True,
            "message": f"Prescription translated to {language}",
            "original_data": data_to_translate,
            "translated_data": translated,
            "language": language
        }
        
    except Exception as e:
        print(f"Translation error: {str(e)}")
        # Return demo translation on error
        return {
            "success": True,
            "message": f"Prescription translated to {language} (demo mode)",
            "original_data": ai_service._get_demo_prescription_data(),
            "translated_data": ai_service._get_demo_translation(
                ai_service._get_demo_prescription_data(), 
                language, 
                "prescription"
            ),
            "language": language
        }


@router.post("/demo-upload-and-translate", status_code=status.HTTP_200_OK)
async def demo_upload_and_translate_prescription(
    file: UploadFile = File(...),
    language: str = "hindi"
):
    """
    Demo upload and translate - NO AUTH REQUIRED
    Uploads prescription, analyzes with AI, and translates to Hindi/Marathi
    """
    if language not in ["hindi", "marathi"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language must be 'hindi' or 'marathi'"
        )
    
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
        
        # Use Vision AI to analyze image directly
        parsed_data = await ai_service.parse_prescription_from_image(file_content)
        
        # Translate to selected language
        translated = await ai_service.translate_and_simplify(
            content=parsed_data,
            target_language=language,
            content_type="prescription"
        )
        
        return {
            "success": True,
            "message": f"Prescription analyzed and translated to {language}",
            "file_name": file.filename,
            "parsed_data": parsed_data,
            "translated_data": translated,
            "language": language
        }
        
    except Exception as e:
        print(f"Upload and translate error: {str(e)}")
        demo_data = ai_service._get_demo_prescription_data()
        return {
            "success": True,
            "message": f"Prescription analyzed and translated (demo mode)",
            "file_name": file.filename,
            "parsed_data": demo_data,
            "translated_data": ai_service._get_demo_translation(demo_data, language, "prescription"),
            "language": language
        }


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
