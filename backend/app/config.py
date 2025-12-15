"""
Application Configuration
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    DATABASE_URL: str = "postgresql://physiotrack:physiotrack123@localhost: 5432/physiotrack"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Application
    APP_NAME: str = "PhysioTrack AI"
    APP_VERSION: str = "1.0.0"
    
    # MediaPipe
    MIN_DETECTION_CONFIDENCE: float = 0.5
    MIN_TRACKING_CONFIDENCE: float = 0.5
    
    # Exercise Defaults
    DEFAULT_REP_TARGET: int = 10
    DEFAULT_SET_TARGET: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()