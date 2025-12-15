"""
Authentication Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

from app.database import get_db
from app.models import User, Patient
from app.schemas import UserCreate, UserLogin, UserResponse, SuccessResponse
from app.config import settings

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data:  dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data. copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp":  expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


@router.post("/register", response_model=SuccessResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        user_type=user_data.user_type. value,
        first_name=user_data.first_name,
        last_name=user_data. last_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If patient, create patient profile
    if user_data.user_type. value == "patient":
        patient_profile = Patient(
            user_id=new_user.user_id,
            current_week=1
        )
        db.add(patient_profile)
        db.commit()
    
    return SuccessResponse(
        message="User registered successfully",
        data={"user_id": new_user.user_id}
    )


@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and return JWT token
    """
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user. password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.user_id),
            "email": user.email,
            "user_type": user.user_type
        }
    )
    
    # Get patient_id if user is patient
    patient_id = None
    if user.user_type == "patient": 
        patient = db.query(Patient).filter(Patient.user_id == user. user_id).first()
        if patient:
            patient_id = patient.patient_id
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user":  {
            "user_id": user.user_id,
            "email": user.email,
            "user_type": user.user_type,
            "first_name": user.first_name,
            "last_name":  user.last_name,
            "patient_id": patient_id
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(db: Session = Depends(get_db)):
    """
    Get current user info (requires authentication)
    """
    # This is a simplified version - in production, you'd verify JWT token
    # For now, returning mock data for development
    return {
        "user_id": 1,
        "email": "demo@physiotrack.ai",
        "first_name": "Demo",
        "last_name": "User",
        "user_type": "patient",
        "created_at": datetime.now()
    }