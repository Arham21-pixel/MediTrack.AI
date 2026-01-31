"""
MediTrack AI Backend - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routes import auth, prescription, medicine, reports, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"Starting {settings.APP_NAME}...")
    yield
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title="MediTrack AI Backend",
    description="AI-powered prescription and health report management system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/timeline", tags=["Timeline"])
async def get_timeline():
    """Get all health records chronologically"""
    # This will be implemented with actual data
    return {
        "message": "Timeline endpoint - combines prescriptions, medicines, and reports",
        "data": []
    }
