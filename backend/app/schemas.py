"""
Pydantic Schemas for Request/Response Validation
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class UserType(str, Enum):
    PATIENT = "patient"
    PHYSIOTHERAPIST = "physiotherapist"


class ExerciseDifficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class FeedbackSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    user_type: UserType


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# PATIENT SCHEMAS
# ============================================================================

class PatientCreate(BaseModel):
    user_id: int
    assigned_pt_id: Optional[int] = None
    injury_type: Optional[str] = None
    injury_date: Optional[datetime] = None
    surgery_date: Optional[datetime] = None


class PatientResponse(BaseModel):
    patient_id: int
    user_id: int
    assigned_pt_id: Optional[int]
    injury_type:  Optional[str]
    current_week: int
    
    class Config:
        from_attributes = True


# ============================================================================
# EXERCISE SCHEMAS
# ============================================================================

class ExerciseBase(BaseModel):
    exercise_code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[ExerciseDifficulty] = None
    target_rom: Optional[float] = None


class ExerciseCreate(ExerciseBase):
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class ExerciseResponse(ExerciseBase):
    exercise_id: int
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    
    class Config: 
        from_attributes = True


class ExerciseWithRules(ExerciseResponse):
    """Exercise with full clinical rules included"""
    rules: Dict[str, Any]


# ============================================================================
# POSE ANALYSIS SCHEMAS
# ============================================================================

class Landmark(BaseModel):
    """Single MediaPipe landmark"""
    x:  float = Field(..., ge=0.0, le=1.0, description="Normalized X coordinate")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized Y coordinate")
    z: float = Field(..., description="Depth coordinate")
    visibility: float = Field(... , ge=0.0, le=1.0, description="Landmark visibility score")


class AnalyzeFrameRequest(BaseModel):
    """Request to analyze a single frame"""
    session_id: int
    landmarks: List[Landmark] = Field(..., min_length=33, max_length=33)
    timestamp: float
    frame_number: Optional[int] = None
    
    @validator('landmarks')
    def validate_landmarks_count(cls, v):
        if len(v) != 33:
            raise ValueError('Must provide exactly 33 landmarks')
        return v


class FeedbackItem(BaseModel):
    """Single feedback message"""
    type: str  # 'compensation', 'velocity', 'rom', 'timing'
    category: Optional[str] = None
    severity: FeedbackSeverity
    message: str
    current_value: Optional[float] = None
    threshold:  Optional[str] = None


class AnalyzeFrameResponse(BaseModel):
    """Response from frame analysis"""
    angles: Dict[str, float]
    feedback:  List[FeedbackItem]
    rep_count: int
    quality_reps: int
    state: str
    quality_score: float
    timestamp: float


# ============================================================================
# SESSION SCHEMAS
# ============================================================================

class SessionStart(BaseModel):
    """Request to start exercise session"""
    patient_id:  int
    exercise_id: int


class SessionStartResponse(BaseModel):
    """Response when session starts"""
    session_id: int
    exercise_code: str
    exercise_rules: Dict[str, Any]
    started_at: datetime


class SessionEnd(BaseModel):
    """Request to end session"""
    session_id: int
    notes: Optional[str] = None


class SessionSummary(BaseModel):
    """Summary of completed session"""
    session_id:  int
    duration_seconds: int
    total_reps: int
    quality_reps: int
    average_quality_score: float
    feedback_summary: Dict[str, int]  # Count of each feedback type
    rom_achieved: Optional[float] = None


class SessionHistory(BaseModel):
    """Historical session data"""
    session_id: int
    exercise_name: str
    start_time: datetime
    duration_seconds: Optional[int]
    total_reps: int
    quality_reps: int
    average_quality_score:  Optional[float]
    completed: bool
    
    class Config:
        from_attributes = True


# ============================================================================
# ANALYTICS SCHEMAS
# ============================================================================

class ROMTrend(BaseModel):
    """Range of motion trend data"""
    week:  int
    average_rom: float
    max_rom: float
    sessions_count: int


class ExerciseProgress(BaseModel):
    """Progress for a specific exercise"""
    exercise_name: str
    exercise_code: str
    current_week: int
    rom_trends: List[ROMTrend]
    adherence_rate: float
    quality_score_trend: float
    last_session:  Optional[datetime]


class PatientAnalytics(BaseModel):
    """Complete patient analytics"""
    patient_id: int
    patient_name: str
    injury_type: Optional[str]
    current_week: int
    exercises:  List[ExerciseProgress]
    overall_adherence: float
    red_flags: List[str]


class PTDashboardPatient(BaseModel):
    """Patient summary for PT dashboard"""
    patient_id:  int
    user_id: int
    full_name: str
    injury_type: Optional[str]
    current_week: int
    last_session: Optional[datetime]
    adherence_rate: float
    red_flags_count: int
    
    class Config:
        from_attributes = True


# ============================================================================
# MOVEMENT DATA SCHEMAS
# ============================================================================

class MovementDataCreate(BaseModel):
    """Create movement data entry"""
    session_id: int
    timestamp: datetime
    frame_number: Optional[int]
    joint_angles: Dict[str, float]
    landmarks:  Optional[List[Dict]] = None
    quality_score:  Optional[float] = None


class MovementDataResponse(BaseModel):
    """Movement data response"""
    movement_id: int
    session_id: int
    timestamp: datetime
    joint_angles: Dict[str, float]
    quality_score: Optional[float]
    
    class Config:
        from_attributes = True


# ============================================================================
# FEEDBACK LOG SCHEMAS
# ============================================================================

class FeedbackLogCreate(BaseModel):
    """Create feedback log entry"""
    session_id:  int
    timestamp: datetime
    feedback_type: str
    feedback_category: Optional[str]
    feedback_message: str
    severity: FeedbackSeverity
    current_value: Optional[float]
    threshold_value: Optional[float]


class FeedbackLogResponse(BaseModel):
    """Feedback log response"""
    feedback_id:  int
    timestamp: datetime
    feedback_type:  str
    feedback_message: str
    severity: FeedbackSeverity
    
    class Config:
        from_attributes = True


# ============================================================================
# RESPONSE WRAPPERS
# ============================================================================

class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = True
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Generic error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None