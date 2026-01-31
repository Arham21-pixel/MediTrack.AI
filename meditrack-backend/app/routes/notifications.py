"""
Notification Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from uuid import uuid4

from app.routes.auth import get_current_user
from app.services.notification_service import NotificationService
from app.database import medicine_db, prescription_db

router = APIRouter()

# Initialize notification service
notification_service = NotificationService()


# Request/Response models
class SendReminderRequest(BaseModel):
    medicine_id: Optional[str] = None
    message: Optional[str] = None
    channel: str = "sms"  # "sms", "whatsapp", "both"
    phone_number: Optional[str] = None


class NotificationSettingsUpdate(BaseModel):
    sms_enabled: bool = True
    whatsapp_enabled: bool = True
    reminder_times: List[str] = ["08:00", "13:00", "20:00"]
    reminder_before_minutes: int = 15
    family_alerts_enabled: bool = False
    family_phone_numbers: List[str] = []


class NotificationHistoryItem(BaseModel):
    id: str
    type: str
    channel: str
    message: str
    status: str
    sent_at: datetime
    medicine_name: Optional[str] = None


class NotificationSettings(BaseModel):
    sms_enabled: bool = True
    whatsapp_enabled: bool = True
    reminder_times: List[str] = ["08:00", "13:00", "20:00"]
    reminder_before_minutes: int = 15
    family_alerts_enabled: bool = False
    family_phone_numbers: List[str] = []


# In-memory storage for demo (replace with database in production)
notification_history = []
user_notification_settings = {}


@router.post("/send-reminder")
async def send_reminder(
    request: SendReminderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a medicine reminder notification
    """
    phone_number = request.phone_number or current_user.get("phone")
    
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No phone number provided. Please update your profile with a phone number."
        )
    
    # Get medicine details if medicine_id is provided
    medicine_name = "your medicine"
    if request.medicine_id:
        medicine = await medicine_db.get_by_id(request.medicine_id)
        if medicine:
            # Verify ownership
            prescription = await prescription_db.get_by_id(medicine["prescription_id"])
            if prescription and prescription["user_id"] == current_user["id"]:
                medicine_name = medicine.get("name", "your medicine")
                dosage = medicine.get("dosage", "")
                if dosage:
                    medicine_name = f"{medicine_name} ({dosage})"
    
    # Prepare message
    message = request.message or f"⏰ Medicine Reminder: It's time to take {medicine_name}. Stay healthy! 💊"
    
    results = {"sms": None, "whatsapp": None}
    
    try:
        # Send SMS
        if request.channel in ["sms", "both"]:
            sms_result = await notification_service.send_sms(
                phone_number=phone_number,
                message=message
            )
            results["sms"] = sms_result
            
            # Log notification
            notification_history.append({
                "id": str(uuid4()),
                "user_id": current_user["id"],
                "type": "reminder",
                "channel": "sms",
                "message": message,
                "status": "sent" if sms_result.get("success") else "failed",
                "sent_at": datetime.utcnow().isoformat(),
                "medicine_name": medicine_name
            })
        
        # Send WhatsApp
        if request.channel in ["whatsapp", "both"]:
            whatsapp_result = await notification_service.send_whatsapp(
                phone_number=phone_number,
                message=message
            )
            results["whatsapp"] = whatsapp_result
            
            # Log notification
            notification_history.append({
                "id": str(uuid4()),
                "user_id": current_user["id"],
                "type": "reminder",
                "channel": "whatsapp",
                "message": message,
                "status": "sent" if whatsapp_result.get("success") else "failed",
                "sent_at": datetime.utcnow().isoformat(),
                "medicine_name": medicine_name
            })
        
        return {
            "message": "Reminder sent successfully",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send reminder: {str(e)}"
        )


@router.get("/history", response_model=List[NotificationHistoryItem])
async def get_notification_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Get notification history for the current user
    """
    # Filter by user
    user_notifications = [
        n for n in notification_history 
        if n.get("user_id") == current_user["id"]
    ]
    
    # Sort by sent_at (newest first)
    user_notifications.sort(key=lambda x: x.get("sent_at", ""), reverse=True)
    
    # Limit results
    return user_notifications[:limit]


@router.get("/settings", response_model=NotificationSettings)
async def get_notification_settings(current_user: dict = Depends(get_current_user)):
    """
    Get notification settings for the current user
    """
    user_id = current_user["id"]
    
    # Return user's settings or defaults
    settings = user_notification_settings.get(user_id, {
        "sms_enabled": True,
        "whatsapp_enabled": True,
        "reminder_times": ["08:00", "13:00", "20:00"],
        "reminder_before_minutes": 15,
        "family_alerts_enabled": False,
        "family_phone_numbers": []
    })
    
    return NotificationSettings(**settings)


@router.put("/settings", response_model=NotificationSettings)
async def update_notification_settings(
    settings: NotificationSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update notification settings for the current user
    """
    user_id = current_user["id"]
    
    # Update settings
    user_notification_settings[user_id] = settings.model_dump()
    
    return NotificationSettings(**user_notification_settings[user_id])


@router.post("/test")
async def test_notification(
    channel: str = "sms",
    current_user: dict = Depends(get_current_user)
):
    """
    Send a test notification to verify setup
    """
    phone_number = current_user.get("phone")
    
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No phone number in your profile. Please update your profile first."
        )
    
    message = "🧪 Test notification from MediTrack AI. Your notifications are working correctly! ✅"
    
    try:
        if channel == "sms":
            result = await notification_service.send_sms(phone_number, message)
        elif channel == "whatsapp":
            result = await notification_service.send_whatsapp(phone_number, message)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid channel. Use 'sms' or 'whatsapp'"
            )
        
        return {
            "message": "Test notification sent",
            "channel": channel,
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test notification: {str(e)}"
        )


@router.post("/family-alert")
async def send_family_alert(
    message: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Send alert to family members
    """
    user_id = current_user["id"]
    settings = user_notification_settings.get(user_id, {})
    
    if not settings.get("family_alerts_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Family alerts are not enabled. Please enable them in settings."
        )
    
    family_numbers = settings.get("family_phone_numbers", [])
    
    if not family_numbers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No family phone numbers configured."
        )
    
    results = []
    user_name = current_user.get("name", "A family member")
    alert_message = f"⚠️ MediTrack Alert: {user_name} - {message}"
    
    for phone in family_numbers:
        try:
            result = await notification_service.send_sms(phone, alert_message)
            results.append({"phone": phone, "status": "sent", "result": result})
        except Exception as e:
            results.append({"phone": phone, "status": "failed", "error": str(e)})
    
    return {
        "message": "Family alerts sent",
        "results": results
    }


@router.post("/schedule-reminders")
async def schedule_daily_reminders(current_user: dict = Depends(get_current_user)):
    """
    Schedule automatic daily reminders based on medicine schedule
    This is a placeholder - in production, use a task scheduler like Celery
    """
    # Get user's medicines and settings
    prescriptions = await prescription_db.get_by_user_id(current_user["id"])
    
    all_medicines = []
    for prescription in prescriptions:
        medicines = await medicine_db.get_by_prescription_id(prescription["id"])
        all_medicines.extend(medicines)
    
    # Get active medicines
    today = datetime.now().date()
    active_medicines = [
        m for m in all_medicines
        if not m.get("end_date") or 
        datetime.fromisoformat(m["end_date"]).date() >= today
    ]
    
    return {
        "message": "Reminders scheduled",
        "active_medicines_count": len(active_medicines),
        "note": "In production, this would integrate with a task scheduler"
    }
