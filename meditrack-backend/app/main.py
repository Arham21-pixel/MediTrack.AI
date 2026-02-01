"""
MediTrack AI Backend - FastAPI Application Entry Point
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from app.config import settings
from app.routes import auth, prescription, medicine, reports, notifications
from app.database import prescription_db, medicine_db, health_report_db
from app.routes.auth import get_current_user_optional


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    import os
    print(f"Starting {settings.APP_NAME} from {os.path.abspath(__file__)}...")
    yield
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title="MediTrack AI Backend",
    description="AI-powered prescription and health report management system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware - Allow frontend origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.4.183:3000",
    "http://192.168.4.183:3001",
    settings.FRONTEND_URL,
    "https://meditrack.vercel.app",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(prescription.router, prefix="/api/prescriptions", tags=["Prescriptions"])
app.include_router(medicine.router, prefix="/api/medicines", tags=["Medicines"])
app.include_router(reports.router, prefix="/api/reports", tags=["Health Reports"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "message": "MediTrack AI Backend Running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
    }


@app.get("/api/timeline", tags=["Timeline"])
async def get_timeline(
    limit: int = 50,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get all health records chronologically.
    Aggregates prescriptions, medicines, and reports into a single timeline feed.
    """
    timeline_items = []
    
    try:
        # If no user, return demo data
        if not current_user:
            return {
                "items": get_demo_timeline(),
                "total": 5,
                "message": "Demo timeline - login for personalized data"
            }
        
        user_id = current_user["id"]
        
        # 1. Get Prescriptions
        try:
            prescriptions = await prescription_db.get_by_user_id(user_id)
            for rx in prescriptions:
                parsed_data = rx.get("parsed_data", {}) or {}
                doctor_name = parsed_data.get("doctor_name") or rx.get("doctor_name") or "Unknown Doctor"
                medicines_count = len(parsed_data.get("medicines", []))
                
                timeline_items.append({
                    "id": rx["id"],
                    "type": "prescription",
                    "title": f"Prescription from {doctor_name}",
                    "description": f"{medicines_count} medicines prescribed",
                    "date": rx.get("uploaded_at", datetime.utcnow().isoformat()),
                    "status": "active",
                    "metadata": {
                        "doctor_name": doctor_name,
                        "medicines_count": medicines_count,
                        "file_url": rx.get("file_url"),
                    }
                })
        except Exception as e:
            print(f"Error fetching prescriptions: {e}")
        
        # 2. Get Health Reports
        try:
            reports = await health_report_db.get_by_user_id(user_id)
            for report in reports:
                risk_level = report.get("risk_level", "normal")
                report_type = report.get("report_type", "General")
                
                timeline_items.append({
                    "id": report["id"],
                    "type": "report",
                    "title": f"{report_type} Report",
                    "description": report.get("ai_summary", "Health report analyzed by AI"),
                    "date": report.get("uploaded_at", datetime.utcnow().isoformat()),
                    "status": risk_level,
                    "metadata": {
                        "report_type": report_type,
                        "risk_level": risk_level,
                        "lab_values": report.get("lab_values"),
                        "file_url": report.get("file_url"),
                    }
                })
        except Exception as e:
            print(f"Error fetching reports: {e}")
        
        # 3. Get Medicine Logs (recent activity)
        try:
            # Get all prescriptions for user to get medicine IDs
            prescriptions = await prescription_db.get_by_user_id(user_id)
            prescription_ids = [p["id"] for p in prescriptions]
            
            for prescription_id in prescription_ids[:5]:  # Limit to recent prescriptions
                medicines = await medicine_db.get_by_prescription_id(prescription_id)
                
                for med in medicines[:10]:  # Limit medicines per prescription
                    # Check if medicine is currently active
                    end_date = med.get("end_date")
                    is_active = True
                    if end_date:
                        try:
                            end_date_obj = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                            is_active = end_date_obj.replace(tzinfo=None) >= datetime.utcnow()
                        except:
                            pass
                    
                    if is_active:
                        timeline_items.append({
                            "id": med["id"],
                            "type": "medicine",
                            "title": f"{med['name']}",
                            "description": f"{med.get('dosage', 'As prescribed')} - {med.get('frequency', 'Daily')}",
                            "date": med.get("start_date") or med.get("created_at", datetime.utcnow().isoformat()),
                            "status": "active",
                            "metadata": {
                                "dosage": med.get("dosage"),
                                "frequency": med.get("frequency"),
                                "timing": med.get("timing", []),
                                "days_remaining": med.get("duration_days"),
                            }
                        })
        except Exception as e:
            print(f"Error fetching medicines: {e}")
        
        # Sort by date (newest first)
        timeline_items.sort(key=lambda x: x["date"], reverse=True)
        
        # Limit results
        timeline_items = timeline_items[:limit]
        
        return {
            "items": timeline_items,
            "total": len(timeline_items)
        }
        
    except Exception as e:
        print(f"Timeline error: {e}")
        return {
            "items": get_demo_timeline(),
            "total": 5,
            "message": "Error fetching timeline - showing demo data"
        }


def get_demo_timeline():
    """Return demo timeline data for unauthenticated users or errors"""
    now = datetime.utcnow().isoformat()
    
    return [
        {
            "id": "demo-1",
            "type": "prescription",
            "title": "Prescription from Dr. Sarah Johnson",
            "description": "3 medicines prescribed for viral infection",
            "date": now,
            "status": "active",
            "metadata": {"doctor_name": "Dr. Sarah Johnson", "medicines_count": 3}
        },
        {
            "id": "demo-2",
            "type": "report",
            "title": "Blood Test Report",
            "description": "All values within normal range. Great progress!",
            "date": now,
            "status": "normal",
            "metadata": {"report_type": "CBC", "risk_level": "normal"}
        },
        {
            "id": "demo-3",
            "type": "medicine",
            "title": "Amoxicillin 500mg",
            "description": "Take 3 times daily after meals",
            "date": now,
            "status": "active",
            "metadata": {"dosage": "500mg", "frequency": "3x daily"}
        },
        {
            "id": "demo-4",
            "type": "report",
            "title": "Lipid Profile",
            "description": "Cholesterol slightly elevated - dietary changes recommended",
            "date": now,
            "status": "warning",
            "metadata": {"report_type": "Lipid Profile", "risk_level": "warning"}
        },
        {
            "id": "demo-5",
            "type": "prescription",
            "title": "Prescription from Dr. Mike Chen",
            "description": "Vitamin supplements prescribed",
            "date": now,
            "status": "completed",
            "metadata": {"doctor_name": "Dr. Mike Chen", "medicines_count": 2}
        },
    ]
