"""
Enhanced Analytics with Trends and Predictions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from statistics import mean

from app.database import get_db
from app.models import Patient, ExerciseSession, Exercise, MovementData, FeedbackLog


router = APIRouter()


# Pydantic models
class WeeklyTrend(BaseModel):
    week: int
    avg_rom: float
    avg_quality: float
    session_count: int
    improvement_percentage: Optional[float] = None


class ExerciseComparison(BaseModel):
    exercise_name: str
    exercise_id: int
    total_sessions: int
    avg_quality: float
    rom_progress: float
    adherence_rate: float
    needs_attention: bool


class AdherencePattern(BaseModel):
    best_time_of_day: Optional[int] = None
    best_day_of_week: Optional[str] = None
    average_session_duration: Optional[float] = None
    current_streak: int
    longest_streak: int
    total_sessions: int
    adherence_rate: float
    missed_days_last_week: int


class PredictionData(BaseModel):
    current_rom: float
    target_rom: float
    predicted_rom_next_week: float
    estimated_weeks_to_target: Optional[int]
    confidence: str


@router.get("/patient/{patient_id}/trends")
async def get_exercise_trends(
    patient_id: int,
    exercise_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get trend analysis for ROM, quality, adherence over time
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Build query
    query = db.query(ExerciseSession).filter(
        ExerciseSession.patient_id == patient_id,
        ExerciseSession.completed == True
    )
    
    if exercise_id:
        query = query.filter(ExerciseSession.exercise_id == exercise_id)
    
    sessions = query.order_by(ExerciseSession.start_time).all()
    
    if not sessions:
        return {"trends": [], "overall_improvement": 0}
    
    # Group by week
    weekly_data = {}
    for session in sessions:
        week = (session.start_time.date() - sessions[0].start_time.date()).days // 7 + 1
        
        if week not in weekly_data:
            weekly_data[week] = {
                'sessions': [],
                'rom_values': [],
                'quality_scores': []
            }
        
        weekly_data[week]['sessions'].append(session)
        
        if session.average_quality_score:
            weekly_data[week]['quality_scores'].append(session.average_quality_score)
        
        # Get ROM from movement data
        movement_data = db.query(MovementData).filter(
            MovementData.session_id == session.session_id
        ).all()
        
        for md in movement_data:
            if md.joint_angles:
                rom_values = list(md.joint_angles.values())
                if rom_values:
                    weekly_data[week]['rom_values'].extend(rom_values)
    
    # Calculate trends
    trends = []
    prev_avg_rom = None
    
    for week in sorted(weekly_data.keys()):
        data = weekly_data[week]
        
        avg_rom = mean(data['rom_values']) if data['rom_values'] else 0
        avg_quality = mean(data['quality_scores']) if data['quality_scores'] else 0
        
        improvement = None
        if prev_avg_rom and avg_rom > 0:
            improvement = round(((avg_rom - prev_avg_rom) / prev_avg_rom) * 100, 1)
        
        trends.append(WeeklyTrend(
            week=week,
            avg_rom=round(avg_rom, 1),
            avg_quality=round(avg_quality, 1),
            session_count=len(data['sessions']),
            improvement_percentage=improvement
        ))
        
        prev_avg_rom = avg_rom
    
    # Calculate overall improvement
    if len(trends) >= 2:
        first_rom = trends[0].avg_rom
        last_rom = trends[-1].avg_rom
        overall_improvement = round(((last_rom - first_rom) / first_rom) * 100, 1) if first_rom > 0 else 0
    else:
        overall_improvement = 0
    
    return {
        "trends": trends,
        "overall_improvement": overall_improvement
    }


@router.get("/patient/{patient_id}/compare-exercises")
async def compare_exercises(patient_id: int, db: Session = Depends(get_db)):
    """
    Compare performance across different exercises
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all exercises the patient has done
    exercise_ids = db.query(ExerciseSession.exercise_id).filter(
        ExerciseSession.patient_id == patient_id,
        ExerciseSession.completed == True
    ).distinct().all()
    
    comparisons = []
    
    for (ex_id,) in exercise_ids:
        exercise = db.query(Exercise).filter(Exercise.exercise_id == ex_id).first()
        if not exercise:
            continue
        
        sessions = db.query(ExerciseSession).filter(
            ExerciseSession.patient_id == patient_id,
            ExerciseSession.exercise_id == ex_id,
            ExerciseSession.completed == True
        ).all()
        
        if not sessions:
            continue
        
        # Calculate metrics
        quality_scores = [s.average_quality_score for s in sessions if s.average_quality_score]
        avg_quality = mean(quality_scores) if quality_scores else 0
        
        # ROM progress (first session vs last session)
        first_rom = get_session_max_rom(sessions[0].session_id, db)
        last_rom = get_session_max_rom(sessions[-1].session_id, db)
        rom_progress = last_rom - first_rom if first_rom and last_rom else 0
        
        # Adherence (assuming 3 sessions per week)
        weeks_active = (sessions[-1].start_time - sessions[0].start_time).days // 7 + 1
        expected_sessions = weeks_active * 3
        adherence_rate = min((len(sessions) / expected_sessions) * 100, 100) if expected_sessions > 0 else 0
        
        # Needs attention if quality < 70% or adherence < 60%
        needs_attention = avg_quality < 70 or adherence_rate < 60
        
        comparisons.append(ExerciseComparison(
            exercise_name=exercise.name,
            exercise_id=ex_id,
            total_sessions=len(sessions),
            avg_quality=round(avg_quality, 1),
            rom_progress=round(rom_progress, 1),
            adherence_rate=round(adherence_rate, 1),
            needs_attention=needs_attention
        ))
    
    # Sort by needs_attention first, then by avg_quality
    comparisons.sort(key=lambda x: (not x.needs_attention, -x.avg_quality))
    
    return {"exercises": comparisons}


@router.get("/patient/{patient_id}/adherence-insights")
async def get_adherence_insights(patient_id: int, db: Session = Depends(get_db)):
    """
    Analyze adherence patterns and provide insights
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    sessions = db.query(ExerciseSession).filter(
        ExerciseSession.patient_id == patient_id,
        ExerciseSession.completed == True
    ).order_by(ExerciseSession.start_time).all()
    
    if not sessions:
        return AdherencePattern(
            current_streak=0,
            longest_streak=0,
            total_sessions=0,
            adherence_rate=0,
            missed_days_last_week=7
        )
    
    # Find best time of day
    hours = [s.start_time.hour for s in sessions]
    best_hour = max(set(hours), key=hours.count) if hours else None
    
    # Find best day of week
    days = [s.start_time.strftime('%A') for s in sessions]
    best_day = max(set(days), key=days.count) if days else None
    
    # Average session duration
    durations = [s.duration_seconds for s in sessions if s.duration_seconds]
    avg_duration = mean(durations) if durations else None
    
    # Calculate streaks
    session_dates = sorted(set(s.start_time.date() for s in sessions))
    current_streak = calculate_current_streak_from_dates(session_dates)
    longest_streak = calculate_longest_streak_from_dates(session_dates)
    
    # Missed days last week
    today = datetime.utcnow().date()
    last_week_start = today - timedelta(days=7)
    sessions_last_week = [s for s in sessions if s.start_time.date() >= last_week_start]
    days_exercised_last_week = len(set(s.start_time.date() for s in sessions_last_week))
    missed_days = 7 - days_exercised_last_week
    
    # Overall adherence rate (assuming 3 sessions per week)
    weeks_active = (sessions[-1].start_time.date() - sessions[0].start_time.date()).days // 7 + 1
    expected_sessions = weeks_active * 3
    adherence_rate = min((len(sessions) / expected_sessions) * 100, 100) if expected_sessions > 0 else 0
    
    return AdherencePattern(
        best_time_of_day=best_hour,
        best_day_of_week=best_day,
        average_session_duration=round(avg_duration, 1) if avg_duration else None,
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_sessions=len(sessions),
        adherence_rate=round(adherence_rate, 1),
        missed_days_last_week=missed_days
    )


@router.get("/patient/{patient_id}/predictions")
async def get_predictions(
    patient_id: int,
    exercise_id: int,
    db: Session = Depends(get_db)
):
    """
    Predict recovery timeline using linear regression
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    exercise = db.query(Exercise).filter(Exercise.exercise_id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Get historical sessions
    sessions = db.query(ExerciseSession).filter(
        ExerciseSession.patient_id == patient_id,
        ExerciseSession.exercise_id == exercise_id,
        ExerciseSession.completed == True
    ).order_by(ExerciseSession.start_time).all()
    
    if len(sessions) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 sessions for predictions")
    
    # Get ROM values per session
    rom_data = []
    for session in sessions:
        max_rom = get_session_max_rom(session.session_id, db)
        if max_rom:
            rom_data.append(max_rom)
    
    if len(rom_data) < 3:
        raise HTTPException(status_code=400, detail="Insufficient ROM data for predictions")
    
    # Simple linear regression
    n = len(rom_data)
    x = list(range(1, n + 1))  # Session numbers
    y = rom_data
    
    # Calculate slope and intercept
    x_mean = mean(x)
    y_mean = mean(y)
    
    numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    
    slope = numerator / denominator if denominator != 0 else 0
    intercept = y_mean - slope * x_mean
    
    # Predict next week (assuming 3 sessions per week, so next week = n + 3)
    predicted_next_week = slope * (n + 3) + intercept
    
    # Estimate weeks to target
    target_rom = exercise.target_rom or 180
    current_rom = rom_data[-1]
    
    if slope > 0:
        sessions_to_target = (target_rom - current_rom) / slope
        weeks_to_target = int(sessions_to_target / 3) + 1
    else:
        weeks_to_target = None
    
    # Confidence based on consistency
    rom_variance = sum((v - y_mean) ** 2 for v in rom_data) / n
    confidence = "High" if rom_variance < 100 else "Medium" if rom_variance < 300 else "Low"
    
    return PredictionData(
        current_rom=round(current_rom, 1),
        target_rom=target_rom,
        predicted_rom_next_week=round(predicted_next_week, 1),
        estimated_weeks_to_target=weeks_to_target if weeks_to_target and weeks_to_target > 0 else None,
        confidence=confidence
    )


# Helper functions
def get_session_max_rom(session_id: int, db: Session) -> Optional[float]:
    """Get maximum ROM achieved in a session"""
    movement_data = db.query(MovementData).filter(
        MovementData.session_id == session_id
    ).all()
    
    if not movement_data:
        return None
    
    max_rom = 0
    for md in movement_data:
        if md.joint_angles:
            rom_values = list(md.joint_angles.values())
            if rom_values:
                max_rom = max(max_rom, max(rom_values))
    
    return max_rom if max_rom > 0 else None


def calculate_current_streak_from_dates(dates: List) -> int:
    """Calculate current consecutive days streak"""
    if not dates:
        return 0
    
    today = datetime.utcnow().date()
    streak = 0
    expected_date = today
    
    for date in reversed(dates):
        if date == expected_date or date == expected_date - timedelta(days=1):
            streak += 1
            expected_date = date - timedelta(days=1)
        elif date < expected_date - timedelta(days=1):
            break
    
    return streak


def calculate_longest_streak_from_dates(dates: List) -> int:
    """Calculate longest consecutive days streak"""
    if not dates:
        return 0
    
    longest = 0
    current = 1
    
    for i in range(1, len(dates)):
        if dates[i] == dates[i-1] + timedelta(days=1):
            current += 1
        else:
            longest = max(longest, current)
            current = 1
    
    return max(longest, current)
