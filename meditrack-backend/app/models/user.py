"""
User Model
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from uuid import UUID


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    """User creation model"""
    password: str


class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str


class UserInDB(UserBase):
    """User model as stored in database"""
    id: UUID
    hashed_password: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """User response model (without sensitive data)"""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    phone: Optional[str] = None


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[str] = None
    email: Optional[str] = None
