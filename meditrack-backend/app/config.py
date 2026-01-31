"""
Configuration management using Pydantic Settings
"""
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Config
    APP_NAME: str = "MediTrack AI"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    DEBUG: bool = True
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    
    # Twilio (SMS/WhatsApp)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"
    
    # Firebase (Optional)
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-key.json"
    
    # AWS S3 (Optional)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = "meditrack-uploads"
    AWS_REGION: str = "ap-south-1"
    
    # Storage Provider: "firebase", "s3", or "local"
    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_PATH: str = "./uploads"
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Get CORS origins list"""
        origins = [self.FRONTEND_URL, "http://localhost:3000", "http://localhost:8000"]
        if self.ENVIRONMENT == "production":
            origins.append("https://meditrack.vercel.app")
        return origins
    
    # JWT Settings
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
