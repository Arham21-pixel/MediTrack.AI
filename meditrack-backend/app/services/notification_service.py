"""
Notification Service - SMS and WhatsApp notifications using Twilio
"""
from typing import Dict, Any, Optional
from twilio.rest import Client

from app.config import settings


class NotificationService:
    """
    Notification Service for sending SMS and WhatsApp messages via Twilio
    """
    
    def __init__(self):
        """Initialize Twilio client"""
        self.client = None
        self.from_phone = settings.TWILIO_PHONE_NUMBER
        self.whatsapp_number = settings.TWILIO_WHATSAPP_NUMBER
        
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                self.client = Client(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
            except Exception as e:
                print(f"Failed to initialize Twilio client: {e}")
    
    async def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """
        Send an SMS message
        
        Args:
            phone_number: Recipient phone number (E.164 format recommended)
            message: Message content
            
        Returns:
            Result dictionary with success status and message SID
        """
        if not self.client:
            return {
                "success": False,
                "error": "Twilio client not configured",
                "mock": True,
                "message": message
            }
        
        try:
            # Format phone number if needed
            formatted_number = self._format_phone_number(phone_number)
            
            # Send SMS
            twilio_message = self.client.messages.create(
                body=message,
                from_=self.from_phone,
                to=formatted_number
            )
            
            return {
                "success": True,
                "message_sid": twilio_message.sid,
                "status": twilio_message.status,
                "to": formatted_number
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_whatsapp(self, phone_number: str, message: str) -> Dict[str, Any]:
        """
        Send a WhatsApp message
        
        Args:
            phone_number: Recipient phone number (E.164 format recommended)
            message: Message content
            
        Returns:
            Result dictionary with success status and message SID
        """
        if not self.client:
            return {
                "success": False,
                "error": "Twilio client not configured",
                "mock": True,
                "message": message
            }
        
        try:
            # Format for WhatsApp
            formatted_number = self._format_phone_number(phone_number)
            whatsapp_to = f"whatsapp:{formatted_number}"
            
            # Send WhatsApp message
            twilio_message = self.client.messages.create(
                body=message,
                from_=self.whatsapp_number,
                to=whatsapp_to
            )
            
            return {
                "success": True,
                "message_sid": twilio_message.sid,
                "status": twilio_message.status,
                "to": whatsapp_to
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_reminder(
        self,
        phone_number: str,
        medicine_name: str,
        dosage: Optional[str] = None,
        channel: str = "sms"
    ) -> Dict[str, Any]:
        """
        Send a medicine reminder
        
        Args:
            phone_number: Recipient phone number
            medicine_name: Name of the medicine
            dosage: Dosage information
            channel: "sms", "whatsapp", or "both"
            
        Returns:
            Result dictionary
        """
        # Build message
        message = f"⏰ Medicine Reminder\n\n"
        message += f"💊 {medicine_name}"
        if dosage:
            message += f" ({dosage})"
        message += "\n\nIt's time to take your medicine. Stay healthy! 🏥"
        
        results = {}
        
        if channel in ["sms", "both"]:
            results["sms"] = await self.send_sms(phone_number, message)
        
        if channel in ["whatsapp", "both"]:
            results["whatsapp"] = await self.send_whatsapp(phone_number, message)
        
        return results
    
    async def send_missed_dose_alert(
        self,
        phone_number: str,
        medicine_name: str,
        scheduled_time: str
    ) -> Dict[str, Any]:
        """
        Send an alert about a missed dose
        
        Args:
            phone_number: Recipient phone number
            medicine_name: Name of the medicine
            scheduled_time: When the dose was scheduled
            
        Returns:
            Result dictionary
        """
        message = f"⚠️ Missed Dose Alert\n\n"
        message += f"You may have missed your {medicine_name} scheduled for {scheduled_time}.\n\n"
        message += "Please take it as soon as possible, unless it's almost time for your next dose."
        
        return await self.send_sms(phone_number, message)
    
    async def send_report_alert(
        self,
        phone_number: str,
        report_type: str,
        risk_level: str,
        summary: str
    ) -> Dict[str, Any]:
        """
        Send an alert about health report analysis
        
        Args:
            phone_number: Recipient phone number
            report_type: Type of health report
            risk_level: Risk level (normal, warning, critical)
            summary: Brief summary
            
        Returns:
            Result dictionary
        """
        emoji = "✅" if risk_level == "normal" else "⚠️" if risk_level == "warning" else "🚨"
        
        message = f"{emoji} Health Report Analysis\n\n"
        message += f"Report: {report_type.upper()}\n"
        message += f"Status: {risk_level.upper()}\n\n"
        message += f"{summary[:200]}"  # Limit summary length
        
        return await self.send_sms(phone_number, message)
    
    async def send_family_alert(
        self,
        phone_numbers: list,
        patient_name: str,
        alert_type: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Send alerts to family members
        
        Args:
            phone_numbers: List of family member phone numbers
            patient_name: Name of the patient
            alert_type: Type of alert
            message: Alert message
            
        Returns:
            Results for each phone number
        """
        full_message = f"🏥 MediTrack Family Alert\n\n"
        full_message += f"Patient: {patient_name}\n"
        full_message += f"Alert: {alert_type}\n\n"
        full_message += message
        
        results = {}
        for phone in phone_numbers:
            results[phone] = await self.send_sms(phone, full_message)
        
        return results
    
    def _format_phone_number(self, phone_number: str) -> str:
        """
        Format phone number to E.164 format
        
        Args:
            phone_number: Phone number in any format
            
        Returns:
            Phone number in E.164 format
        """
        # Remove any non-digit characters except +
        cleaned = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        
        # Add + if not present
        if not cleaned.startswith('+'):
            # Assume Indian number if 10 digits
            if len(cleaned) == 10:
                cleaned = '+91' + cleaned
            # Assume it already has country code
            else:
                cleaned = '+' + cleaned
        
        return cleaned
    
    async def verify_phone_number(self, phone_number: str) -> Dict[str, Any]:
        """
        Verify a phone number using Twilio Lookup
        
        Args:
            phone_number: Phone number to verify
            
        Returns:
            Verification result
        """
        if not self.client:
            return {"valid": True, "mock": True}
        
        try:
            formatted = self._format_phone_number(phone_number)
            lookup = self.client.lookups.v2.phone_numbers(formatted).fetch()
            
            return {
                "valid": lookup.valid,
                "phone_number": lookup.phone_number,
                "country_code": lookup.country_code,
                "carrier": lookup.caller_name
            }
        except Exception as e:
            return {
                "valid": False,
                "error": str(e)
            }


# Singleton instance
notification_service = NotificationService()
