"""
SQLAlchemy Database Models
Defines all database tables
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """Base user model for both patients and physiotherapists"""
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    user_type = Column(String(20), nullable=False)  # 'patient' or 'physiotherapist'
    first_name = Column(String(100))
    last_name = Column(String(100))
    date_of_birth = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    
    def __repr__(self):
        return f"<User {self.email} ({self.user_type})>"


class Patient(Base):
    """Extended patient information"""
    __tablename__ = "patients"
    
    patient_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    assigned_pt_id = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    
    injury_type = Column(String(255))
    injury_date = Column(DateTime, nullable=True)
    surgery_date = Column(DateTime, nullable=True)
    current_week = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])
    assigned_pt = relationship("User", foreign_keys=[assigned_pt_id])
    sessions = relationship("ExerciseSession", back_populates="patient")
    
    def __repr__(self):
        return f"<Patient {self.patient_id} - Week {self.current_week}>"


class Exercise(Base):
    """Exercise definitions"""
    __tablename__ = "exercises"
    
    exercise_id = Column(Integer, primary_key=True, index=True)
    exercise_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(50))  # 'upper_body', 'lower_body', etc.
    difficulty = Column(String(20))  # 'beginner', 'intermediate', 'advanced'
    target_rom = Column(Float)
    video_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Relationships
    sessions = relationship("ExerciseSession", back_populates="exercise")
    
    def __repr__(self):
        return f"<Exercise {self.exercise_code}>"


class ExerciseSession(Base):
    """Individual exercise sessions"""
    __tablename__ = "exercise_sessions"
    
    session_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.patient_id'), nullable=False)
    exercise_id = Column(Integer, ForeignKey('exercises.exercise_id'), nullable=False)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    total_reps = Column(Integer, default=0)
    quality_reps = Column(Integer, default=0)
    average_quality_score = Column(Float, nullable=True)
    
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="sessions")
    exercise = relationship("Exercise", back_populates="sessions")
    movement_data = relationship("MovementData", back_populates="session", cascade="all, delete-orphan")
    feedback_logs = relationship("FeedbackLog", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ExerciseSession {self.session_id} - {self.total_reps} reps>"


class MovementData(Base):
    """Time-series movement data"""
    __tablename__ = "movement_data"
    
    movement_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('exercise_sessions.session_id'), nullable=False)
    
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    frame_number = Column(Integer)
    
    joint_angles = Column(JSON, nullable=False)  # e.g., {"shoulder": 175, "elbow": 170}
    landmarks = Column(JSON, nullable=True)  # Full MediaPipe landmark data
    quality_score = Column(Float, nullable=True)
    
    # Relationships
    session = relationship("ExerciseSession", back_populates="movement_data")
    
    def __repr__(self):
        return f"<MovementData {self.movement_id} at {self.timestamp}>"


class FeedbackLog(Base):
    """Feedback messages given during sessions"""
    __tablename__ = "feedback_logs"
    
    feedback_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('exercise_sessions.session_id'), nullable=False)
    
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    feedback_type = Column(String(50))  # 'compensation', 'velocity', 'rom', 'timing'
    feedback_category = Column(String(50))  # e.g., 'elbow_bend', 'trunk_lean'
    feedback_message = Column(Text, nullable=False)
    severity = Column(String(20))  # 'low', 'medium', 'high'
    
    current_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    
    acknowledged = Column(Boolean, default=False)
    
    # Relationships
    session = relationship("ExerciseSession", back_populates="feedback_logs")
    
    def __repr__(self):
        return f"<FeedbackLog {self.feedback_type} - {self.severity}>"


class ProgressMetric(Base):
    """Aggregated weekly progress metrics"""
    __tablename__ = "progress_metrics"
    
    metric_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.patient_id'), nullable=False)
    exercise_id = Column(Integer, ForeignKey('exercises.exercise_id'), nullable=False)
    week_number = Column(Integer, nullable=False)
    
    average_rom = Column(Float)  # Average range of motion achieved
    max_rom = Column(Float)  # Best ROM achieved
    total_sessions = Column(Integer, default=0)
    adherence_rate = Column(Float)  # Percentage of prescribed sessions completed
    quality_score_trend = Column(Float)  # Positive = improving, negative = declining
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ProgressMetric Patient {self.patient_id} Week {self.week_number}>"