"""
Notification Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from uuid import uuid4

from app.routes.auth import get_current_user, get_current_user_optional
from app.services.notification_service import NotificationService
from app.services.email_service import email_service
from app.database import medicine_db, prescription_db

router = APIRouter()

# Initialize notification service
notification_service = NotificationService()


# Request/Response models
class SendReminderRequest(BaseModel):
    medicine_id: Optional[str] = None
    message: Optional[str] = None
    channel: str = "sms"  # "sms", "whatsapp", "both", "email"
    phone_number: Optional[str] = None
    email: Optional[str] = None


class EmailNotificationRequest(BaseModel):
    email: str
    notification_type: str  # "reminder", "missed_dose", "low_supply", "weekly_summary", "test"
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    time: Optional[str] = None
    remaining_days: Optional[int] = None


class NotificationSettingsUpdate(BaseModel):
    sms_enabled: bool = True
    whatsapp_enabled: bool = True
    email_enabled: bool = True
    email_address: Optional[str] = None
    push_notifications: bool = True
    reminder_times: List[str] = ["08:00", "13:00", "20:00"]
    reminder_before_minutes: int = 15
    family_alerts_enabled: bool = False
    family_phone_numbers: List[str] = []
    # Alert types
    missed_meds_alert: bool = True
    low_supply_alert: bool = True
    lab_results_alert: bool = True
    family_updates_alert: bool = True


class FamilyInviteRequest(BaseModel):
    email: str
    name: str
    relation: str
    access_level: str  # "admin", "view-only", "alerts-only"


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


# ============ EMAIL NOTIFICATION ENDPOINTS ============

@router.post("/email/send")
async def send_email_notification(
    request: EmailNotificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send an email notification
    """
    user_name = current_user.get("name", "there")
    
    try:
        if request.notification_type == "reminder":
            result = await email_service.send_medicine_reminder(
                to_email=request.email,
                medicine_name=request.medicine_name or "your medication",
                dosage=request.dosage or "",
                time=request.time or "",
                user_name=user_name
            )
        elif request.notification_type == "missed_dose":
            result = await email_service.send_missed_dose_alert(
                to_email=request.email,
                medicine_name=request.medicine_name or "your medication",
                missed_time=request.time or "scheduled time",
                user_name=user_name
            )
        elif request.notification_type == "low_supply":
            result = await email_service.send_low_supply_warning(
                to_email=request.email,
                medicine_name=request.medicine_name or "your medication",
                remaining_days=request.remaining_days or 3,
                user_name=user_name
            )
        elif request.notification_type == "test":
            result = await email_service.send_test_email(to_email=request.email)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown notification type: {request.notification_type}"
            )
        
        # Log the notification
        notification_history.append({
            "id": str(uuid4()),
            "user_id": current_user["id"],
            "type": request.notification_type,
            "channel": "email",
            "message": f"Email sent to {request.email}",
            "status": "sent" if result.get("success") else "failed",
            "sent_at": datetime.utcnow().isoformat(),
            "medicine_name": request.medicine_name
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )


class MedicineReminderRequest(BaseModel):
    email: str
    medicine_name: str
    dosage: str
    scheduled_time: str


@router.post("/email/reminder")
async def send_medicine_reminder_email(
    request: MedicineReminderRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Send a medicine reminder email before scheduled dose time.
    Works with or without authentication.
    """
    user_name = current_user.get("name", "there") if current_user else "there"
    
    try:
        # Build HTML email content for reminder
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">💊 Medicine Reminder</h1>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Hi {user_name},
                </p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #84cc16; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #166534; font-weight: 600; margin: 0 0 10px 0; font-size: 18px;">
                        ⏰ Time to take your medication!
                    </p>
                    <p style="color: #15803d; margin: 0;">
                        <strong>Medicine:</strong> {request.medicine_name}<br>
                        <strong>Dosage:</strong> {request.dosage}<br>
                        <strong>Scheduled Time:</strong> {request.scheduled_time}
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    This is a friendly reminder to take your medication on time. Staying consistent with your medication schedule helps ensure the best health outcomes.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3001/dashboard" style="background: #84cc16; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                        Mark as Taken
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This reminder was sent by MediTrack. Never miss a dose again! 💚
                </p>
            </div>
        </div>
        """
        
        result = await email_service.send_email(
            to_email=request.email,
            subject=f"💊 Reminder: Time to take {request.medicine_name}",
            html_content=html_content
        )
        
        # Log notification
        user_id = current_user["id"] if current_user else "anonymous"
        notification_history.append({
            "id": str(uuid4()),
            "user_id": user_id,
            "type": "reminder",
            "channel": "email",
            "message": f"Medicine reminder sent to {request.email} for {request.medicine_name}",
            "status": "sent" if result.get("success") else "failed",
            "sent_at": datetime.utcnow().isoformat(),
            "medicine_name": request.medicine_name
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send reminder email: {str(e)}"
        )


@router.post("/email/test")
async def send_test_email(
    email: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Send a test email to verify email notifications are working.
    Works with or without authentication.
    """
    try:
        result = await email_service.send_test_email(to_email=email)
        
        # Log notification if user is authenticated
        user_id = current_user["id"] if current_user else "anonymous"
        notification_history.append({
            "id": str(uuid4()),
            "user_id": user_id,
            "type": "test",
            "channel": "email",
            "message": f"Test email sent to {email}",
            "status": "sent" if result.get("success") else "failed",
            "sent_at": datetime.utcnow().isoformat()
        })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test email: {str(e)}"
        )


@router.post("/email/weekly-summary")
async def send_weekly_summary_email(
    email: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Send weekly medication summary email.
    Works with or without authentication.
    """
    user_name = current_user.get("name", "there") if current_user else "there"
    
    # Get user's prescriptions and calculate stats if authenticated
    medicine_names = []
    total_doses = 7
    taken_doses = 6
    missed_doses = 1
    
    if current_user:
        prescriptions = await prescription_db.get_by_user_id(current_user["id"])
        
        all_medicines = []
        for prescription in prescriptions:
            medicines = await medicine_db.get_by_prescription_id(prescription["id"])
            all_medicines.extend(medicines)
        
        medicine_names = [m.get("name", "Unknown") for m in all_medicines]
        
        # For demo, use sample data
        total_doses = len(all_medicines) * 7 if all_medicines else 7
        taken_doses = int(total_doses * 0.85)
        missed_doses = total_doses - taken_doses
    
    try:
        result = await email_service.send_weekly_summary(
            to_email=email,
            user_name=user_name,
            total_doses=total_doses,
            taken_doses=taken_doses,
            missed_doses=missed_doses,
            medications_list=medicine_names if medicine_names else ["No medications tracked yet"]
        )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send weekly summary: {str(e)}"
        )


@router.post("/family/invite")
async def send_family_invite(
    request: FamilyInviteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a family sharing invite email
    """
    inviter_name = current_user.get("name", "A MediTrack user")
    
    # Generate invite link
    invite_code = str(uuid4())[:8].upper()
    invite_link = f"http://localhost:3001/invite/{invite_code}"
    
    try:
        result = await email_service.send_family_invite(
            to_email=request.email,
            inviter_name=inviter_name,
            access_level=request.access_level,
            invite_link=invite_link
        )
        
        notification_history.append({
            "id": str(uuid4()),
            "user_id": current_user["id"],
            "type": "family_invite",
            "channel": "email",
            "message": f"Family invite sent to {request.email}",
            "status": "sent" if result.get("success") else "failed",
            "sent_at": datetime.utcnow().isoformat()
        })
        
        return {
            **result,
            "invite_code": invite_code,
            "invite_link": invite_link
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send family invite: {str(e)}"
        )


class FamilyMissedDoseRequest(BaseModel):
    email: str
    family_member_name: str
    medicine_name: str
    missed_time: str


@router.post("/family/missed-dose")
async def send_family_missed_dose_alert(
    request: FamilyMissedDoseRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Send an alert when a family member misses their medication.
    Works with or without authentication.
    """
    user_name = current_user.get("name", "Caregiver") if current_user else "Caregiver"
    
    try:
        # Build HTML email content
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Missed Medication Alert</h1>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Hi {user_name},
                </p>
                
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #991b1b; font-weight: 600; margin: 0 0 10px 0; font-size: 18px;">
                        {request.family_member_name} has missed their medication
                    </p>
                    <p style="color: #7f1d1d; margin: 0;">
                        <strong>Medicine:</strong> {request.medicine_name}<br>
                        <strong>Scheduled Time:</strong> {request.missed_time}
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    Please check on {request.family_member_name} and ensure they take their medication as soon as possible.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3001/dashboard" style="background: #84cc16; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                        View Dashboard
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This alert was sent by MediTrack to help you monitor your family's medication adherence.
                </p>
            </div>
        </div>
        """
        
        result = await email_service.send_email(
            to_email=request.email,
            subject=f"⚠️ {request.family_member_name} Missed Medication - {request.medicine_name}",
            html_content=html_content
        )
        
        # Log notification
        user_id = current_user["id"] if current_user else "anonymous"
        notification_history.append({
            "id": str(uuid4()),
            "user_id": user_id,
            "type": "family_missed_dose",
            "channel": "email",
            "message": f"Family missed dose alert sent to {request.email} for {request.family_member_name}",
            "status": "sent" if result.get("success") else "failed",
            "sent_at": datetime.utcnow().isoformat(),
            "medicine_name": request.medicine_name
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send family missed dose alert: {str(e)}"
        )

