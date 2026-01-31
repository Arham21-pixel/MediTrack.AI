"""
Authentication Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from uuid import uuid4

from app.config import settings
from app.database import user_db
from app.models.user import UserCreate, UserLogin, UserResponse, Token, TokenData

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Pydantic models for auth
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime


# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None:
            return None
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception
    
    user = await user_db.get_by_id(token_data.user_id)
    if user is None:
        raise credentials_exception
    
    return user


# Routes
@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest):
    """
    Register a new user
    """
    # Check if user already exists
    existing_user = await user_db.get_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = str(uuid4())
    hashed_password = get_password_hash(request.password)
    
    user_data = {
        "id": user_id,
        "email": request.email,
        "hashed_password": hashed_password,
        "name": request.name,
        "phone": request.phone,
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        await user_db.create(user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "email": request.email}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    """
    Authenticate user and return token
    """
    # Get user by email
    user = await user_db.get_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"]}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user's profile
    """
    return UserProfileResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name"),
        phone=current_user.get("phone"),
        created_at=current_user.get("created_at", datetime.utcnow())
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user (client should discard the token)
    """
    return {"message": "Successfully logged out", "user_id": current_user["id"]}


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile
    """
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if phone is not None:
        update_data["phone"] = phone
    
    if update_data:
        updated_user = await user_db.update(current_user["id"], update_data)
        if updated_user:
            current_user.update(update_data)
    
    return UserProfileResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name"),
        phone=current_user.get("phone"),
        created_at=current_user.get("created_at", datetime.utcnow())
    )


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Change user password
    """
    # Verify current password
    if not verify_password(current_password, current_user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash and update new password
    new_hashed_password = get_password_hash(new_password)
    await user_db.update(current_user["id"], {"hashed_password": new_hashed_password})
    
    return {"message": "Password changed successfully"}
