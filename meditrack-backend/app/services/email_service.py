"""
Email Service for MediTrack
Handles sending email notifications and reminders using Resend API
"""
import resend
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()


class EmailService:
    def __init__(self):
        # Resend API configuration
        self.api_key = os.getenv("RESEND_API_KEY", "")
        self.from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
        self.from_name = os.getenv("EMAIL_FROM_NAME", "MediTrack")
        
        print(f"[EMAIL] Initializing with API key: {'***' + self.api_key[-6:] if self.api_key else 'NOT SET'}")
        print(f"[EMAIL] From email: {self.from_email}")
        
        # Initialize Resend
        if self.api_key:
            resend.api_key = self.api_key
        
    def _get_html_template(self, title: str, content: str, button_text: str = None, button_url: str = None) -> str:
        """Generate a styled HTML email template"""
        button_html = ""
        if button_text and button_url:
            button_html = f'''
            <a href="{button_url}" style="display: inline-block; background-color: #84cc16; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
                {button_text}
            </a>
            '''
        
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <div style="background-color: #000; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; color: #84cc16; font-size: 24px; font-weight: bold;">
                            💊 MediTrack
                        </h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 32px;">
                        <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px;">
                            {title}
                        </h2>
                        <div style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                            {content}
                        </div>
                        {button_html}
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="margin: 0; color: #888; font-size: 12px;">
                            This email was sent by MediTrack. Never miss a dose again.
                        </p>
                        <p style="margin: 8px 0 0 0; color: #aaa; font-size: 11px;">
                            © {datetime.now().year} MediTrack. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        '''

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_text: str = None
    ) -> dict:
        """
        Send an email using Resend API
        """
        print(f"[EMAIL] Attempting to send email to: {to_email}")
        try:
            if not self.api_key:
                print("[EMAIL] ERROR: No API key configured!")
                return {
                    "success": False,
                    "error": "Resend API key not configured. Please set RESEND_API_KEY in .env",
                    "to": to_email
                }
            
            # Prepare email params
            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            
            if plain_text:
                params["text"] = plain_text
            
            print(f"[EMAIL] Sending via Resend API...")
            # Send email via Resend
            response = resend.Emails.send(params)
            print(f"[EMAIL] Success! Response: {response}")
            
            return {
                "success": True,
                "message": f"Email sent successfully to {to_email}",
                "to": to_email,
                "subject": subject,
                "id": response.get("id") if isinstance(response, dict) else str(response)
            }
            
        except resend.exceptions.ResendError as e:
            print(f"[EMAIL] Resend API error: {e}")
            return {
                "success": False,
                "error": f"Resend API error: {str(e)}",
                "to": to_email
            }
        except Exception as e:
            print(f"[EMAIL] General error: {e}")
            return {
                "success": False,
                "error": f"Failed to send email: {str(e)}",
                "to": to_email
            }

    async def send_medicine_reminder(
        self,
        to_email: str,
        medicine_name: str,
        dosage: str = "",
        time: str = "",
        user_name: str = "there"
    ) -> dict:
        """Send a medicine reminder email"""
        time_text = f" at {time}" if time else ""
        dosage_text = f" ({dosage})" if dosage else ""
        
        content = f'''
        <p>Hi {user_name},</p>
        <p>This is a friendly reminder to take your medication:</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #84cc16; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-weight: bold; color: #166534; font-size: 18px;">
                💊 {medicine_name}{dosage_text}
            </p>
            <p style="margin: 8px 0 0 0; color: #15803d;">
                Scheduled{time_text}
            </p>
        </div>
        <p>Remember to take your medication with water and follow any specific instructions from your doctor.</p>
        <p style="color: #888; font-size: 14px; margin-top: 24px;">Stay healthy! 💪</p>
        '''
        
        html = self._get_html_template(
            title="⏰ Medicine Reminder",
            content=content,
            button_text="Open MediTrack",
            button_url="http://localhost:3001/dashboard"
        )
        
        plain_text = f"Hi {user_name}, it's time to take {medicine_name}{dosage_text}{time_text}. Stay healthy!"
        
        return await self.send_email(
            to_email=to_email,
            subject=f"⏰ Medicine Reminder: {medicine_name}",
            html_content=html,
            plain_text=plain_text
        )

    async def send_missed_dose_alert(
        self,
        to_email: str,
        medicine_name: str,
        missed_time: str,
        user_name: str = "there"
    ) -> dict:
        """Send a missed dose alert email"""
        content = f'''
        <p>Hi {user_name},</p>
        <p>We noticed you may have missed a dose:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 18px;">
                ⚠️ {medicine_name}
            </p>
            <p style="margin: 8px 0 0 0; color: #b91c1c;">
                Scheduled for {missed_time}
            </p>
        </div>
        <p>If you haven't taken it yet, please do so as soon as possible (unless your next dose is coming up soon).</p>
        <p style="color: #888; font-size: 14px;">If you're unsure, please consult your doctor or pharmacist.</p>
        '''
        
        html = self._get_html_template(
            title="⚠️ Missed Dose Alert",
            content=content,
            button_text="Log Your Dose",
            button_url="http://localhost:3001/dashboard/medications"
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=f"⚠️ Missed Dose: {medicine_name}",
            html_content=html
        )

    async def send_low_supply_warning(
        self,
        to_email: str,
        medicine_name: str,
        remaining_days: int,
        user_name: str = "there"
    ) -> dict:
        """Send a low supply warning email"""
        urgency = "critical" if remaining_days <= 3 else "low"
        color = "#ef4444" if remaining_days <= 3 else "#f59e0b"
        bg_color = "#fef2f2" if remaining_days <= 3 else "#fffbeb"
        
        content = f'''
        <p>Hi {user_name},</p>
        <p>Your medicine supply is running low:</p>
        <div style="background-color: {bg_color}; border-left: 4px solid {color}; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-weight: bold; color: {color}; font-size: 18px;">
                📦 {medicine_name}
            </p>
            <p style="margin: 8px 0 0 0; color: {color};">
                Only {remaining_days} day{"s" if remaining_days != 1 else ""} supply remaining
            </p>
        </div>
        <p>Please refill your prescription soon to avoid running out.</p>
        '''
        
        html = self._get_html_template(
            title="📦 Low Supply Warning",
            content=content,
            button_text="View Medications",
            button_url="http://localhost:3001/dashboard/medications"
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=f"📦 Low Supply: {medicine_name} ({remaining_days} days left)",
            html_content=html
        )

    async def send_weekly_summary(
        self,
        to_email: str,
        user_name: str,
        total_doses: int,
        taken_doses: int,
        missed_doses: int,
        medications_list: List[str]
    ) -> dict:
        """Send weekly medication summary email"""
        adherence_rate = round((taken_doses / total_doses * 100) if total_doses > 0 else 0)
        
        # Determine adherence color
        if adherence_rate >= 90:
            adherence_color = "#22c55e"
            adherence_text = "Excellent! 🌟"
        elif adherence_rate >= 70:
            adherence_color = "#f59e0b"
            adherence_text = "Good, keep it up! 👍"
        else:
            adherence_color = "#ef4444"
            adherence_text = "Needs improvement 💪"
        
        meds_html = "".join([f"<li>{med}</li>" for med in medications_list])
        
        content = f'''
        <p>Hi {user_name},</p>
        <p>Here's your weekly medication summary:</p>
        
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <div style="text-align: center; margin-bottom: 16px;">
                <span style="font-size: 48px; font-weight: bold; color: {adherence_color};">{adherence_rate}%</span>
                <p style="margin: 4px 0 0 0; color: {adherence_color}; font-weight: 600;">{adherence_text}</p>
            </div>
            
            <div style="display: flex; justify-content: space-around; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <div>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #22c55e;">{taken_doses}</p>
                    <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">Taken</p>
                </div>
                <div>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #ef4444;">{missed_doses}</p>
                    <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">Missed</p>
                </div>
                <div>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #3b82f6;">{total_doses}</p>
                    <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">Total</p>
                </div>
            </div>
        </div>
        
        <p><strong>Your Medications:</strong></p>
        <ul style="color: #4a4a4a;">{meds_html}</ul>
        
        <p style="color: #888; font-size: 14px; margin-top: 24px;">Keep up the great work! Consistency is key to better health.</p>
        '''
        
        html = self._get_html_template(
            title="📊 Your Weekly Summary",
            content=content,
            button_text="View Full Report",
            button_url="http://localhost:3001/dashboard/timeline"
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=f"📊 Weekly Summary: {adherence_rate}% Adherence",
            html_content=html
        )

    async def send_family_invite(
        self,
        to_email: str,
        inviter_name: str,
        access_level: str,
        invite_link: str
    ) -> dict:
        """Send family sharing invite email"""
        access_description = {
            "admin": "full access to view and manage health data",
            "view-only": "view-only access to health data",
            "alerts-only": "receive medication alerts and reminders"
        }.get(access_level, "access to health data")
        
        content = f'''
        <p>Hi there,</p>
        <p><strong>{inviter_name}</strong> has invited you to join their MediTrack family circle!</p>
        
        <div style="background-color: #f0fdf4; border: 2px solid #84cc16; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #166534;">
                You've been granted <strong>{access_description}</strong>
            </p>
        </div>
        
        <p>With MediTrack Family Sharing, you can:</p>
        <ul style="color: #4a4a4a;">
            <li>Stay informed about your loved one's health</li>
            <li>Receive alerts for missed medications</li>
            <li>Help manage medication schedules</li>
        </ul>
        '''
        
        html = self._get_html_template(
            title="👨‍👩‍👧‍👦 Family Sharing Invite",
            content=content,
            button_text="Accept Invitation",
            button_url=invite_link
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=f"👨‍👩‍👧‍👦 {inviter_name} invited you to MediTrack Family",
            html_content=html
        )

    async def send_test_email(self, to_email: str) -> dict:
        """Send a test email to verify configuration"""
        content = '''
        <p>Hi there!</p>
        <p>This is a test email from MediTrack to confirm that your email notifications are working correctly.</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #84cc16; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #166534;">
                ✅ Your email notifications are set up successfully!
            </p>
        </div>
        <p>You will now receive:</p>
        <ul style="color: #4a4a4a;">
            <li>Medicine reminders</li>
            <li>Missed dose alerts</li>
            <li>Low supply warnings</li>
            <li>Weekly health summaries</li>
        </ul>
        '''
        
        html = self._get_html_template(
            title="✅ Email Notifications Active",
            content=content,
            button_text="Open MediTrack",
            button_url="http://localhost:3001/dashboard"
        )
        
        return await self.send_email(
            to_email=to_email,
            subject="✅ MediTrack Email Notifications Activated",
            html_content=html
        )


# Singleton instance
email_service = EmailService()
