"""
Analytics & Progress Tracking Routes
For patients and physiotherapists to view progress data
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict
from datetime import datetime, timedelta

from app.database import get_db
from app.models import (
    Patient, User, ExerciseSession, Exercise, 
    MovementData, FeedbackLog, ProgressMetric
)
from app.schemas import (
    PatientAnalytics, ExerciseProgress, ROMTrend,
    PTDashboardPatient, SuccessResponse
)

router = APIRouter()


@router.get("/patient/{patient_id}", response_model=PatientAnalytics)
async def get_patient_analytics(patient_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive analytics for a patient
    Used by:  Patient dashboard, PT monitoring
    """
    # Get patient info
    patient = db.query(Patient, User).join(
        User, Patient.user_id == User.user_id
    ).filter(Patient.patient_id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    patient_obj, user_obj = patient
    
    # Get all exercises the patient has done
    exercise_ids = db.query(ExerciseSession.exercise_id).filter(
        ExerciseSession.patient_id == patient_id
    ).distinct().all()
    
    exercise_progress_list = []
    
    for (exercise_id,) in exercise_ids:
        exercise = db.query(Exercise).filter(Exercise.exercise_id == exercise_id).first()
        
        if not exercise:
            continue
        
        # Get ROM trends by week
        rom_trends = []
        for week in range(1, patient_obj.current_week + 1):
            # Get sessions for this week
            week_sessions = db.query(ExerciseSession).filter(
                ExerciseSession.patient_id == patient_id,
                ExerciseSession.exercise_id == exercise_id,
                ExerciseSession.completed == True
            ).all()
            
            if not week_sessions:
                continue
            
            # Calculate average and max ROM for this week
            rom_values = []
            for session in week_sessions:
                movement_data = db.query(MovementData).filter(
                    MovementData.session_id == session.session_id
                ).all()
                
                if movement_data and movement_data[0].joint_angles:
                    first_angle = list(movement_data[0].joint_angles.keys())[0]
                    week_rom = [md.joint_angles.get(first_angle, 0) for md in movement_data]
                    if week_rom:
                        rom_values.extend(week_rom)
            
            if rom_values:
                rom_trends.append(ROMTrend(
                    week=week,
                    average_rom=round(sum(rom_values) / len(rom_values), 1),
                    max_rom=round(max(rom_values), 1),
                    sessions_count=len(week_sessions)
                ))
        
        # Calculate adherence rate (assuming 3 sessions per week prescribed)
        total_sessions = db.query(func.count(ExerciseSession. session_id)).filter(
            ExerciseSession.patient_id == patient_id,
            ExerciseSession.exercise_id == exercise_id,
            ExerciseSession.completed == True
        ).scalar()
        
        expected_sessions = patient_obj.current_week * 3  # 3x per week
        adherence_rate = min((total_sessions / expected_sessions * 100) if expected_sessions > 0 else 0, 100)
        
        # Calculate quality score trend
        recent_sessions = db.query(ExerciseSession).filter(
            ExerciseSession.patient_id == patient_id,
            ExerciseSession.exercise_id == exercise_id,
            ExerciseSession.completed == True
        ).order_by(desc(ExerciseSession.start_time)).limit(10).all()
        
        quality_scores = [s.average_quality_score for s in recent_sessions if s.average_quality_score]
        
        if len(quality_scores) >= 2:
            # Simple linear trend:  compare first half vs second half
            mid = len(quality_scores) // 2
            first_half_avg = sum(quality_scores[:mid]) / mid
            second_half_avg = sum(quality_scores[mid:]) / (len(quality_scores) - mid)
            quality_score_trend = round(second_half_avg - first_half_avg, 1)
        else:
            quality_score_trend = 0.0
        
        # Get last session time
        last_session = db. query(ExerciseSession. start_time).filter(
            ExerciseSession.patient_id == patient_id,
            ExerciseSession.exercise_id == exercise_id
        ).order_by(desc(ExerciseSession.start_time)).first()
        
        exercise_progress_list.append(ExerciseProgress(
            exercise_name=exercise.name,
            exercise_code=exercise.exercise_code,
            current_week=patient_obj.current_week,
            rom_trends=rom_trends,
            adherence_rate=round(adherence_rate, 1),
            quality_score_trend=quality_score_trend,
            last_session=last_session[0] if last_session else None
        ))
    
    # Calculate overall adherence
    all_sessions = db.query(func.count(ExerciseSession. session_id)).filter(
        ExerciseSession.patient_id == patient_id,
        ExerciseSession.completed == True
    ).scalar()
    
    total_exercises = len(exercise_ids)
    expected_total = patient_obj.current_week * 3 * total_exercises
    overall_adherence = min((all_sessions / expected_total * 100) if expected_total > 0 else 0, 100)
    
    # Detect red flags
    red_flags = []
    
    # Check for declining quality scores
    for exercise_prog in exercise_progress_list: 
        if exercise_prog.quality_score_trend < -5:
            red_flags.append(f"Quality declining in {exercise_prog.exercise_name} (-{abs(exercise_prog.quality_score_trend)}%)")
    
    # Check for low adherence
    if overall_adherence < 60:
        red_flags.append(f"Low adherence rate:  {round(overall_adherence, 1)}%")
    
    # Check for no recent activity
    if exercise_progress_list:
        most_recent = max([ep.last_session for ep in exercise_progress_list if ep.last_session])
        if most_recent and (datetime.utcnow() - most_recent).days > 3:
            red_flags.append(f"No activity for {(datetime.utcnow() - most_recent).days} days")
    
    # Check for consistent compensations
    recent_feedback = db.query(FeedbackLog).join(
        ExerciseSession, FeedbackLog.session_id == ExerciseSession.session_id
    ).filter(
        ExerciseSession.patient_id == patient_id,
        FeedbackLog.severity == 'high'
    ).order_by(desc(FeedbackLog.timestamp)).limit(20).all()
    
    compensation_counts = {}
    for feedback in recent_feedback:
        category = feedback.feedback_category or feedback.feedback_type
        compensation_counts[category] = compensation_counts.get(category, 0) + 1
    
    for compensation, count in compensation_counts.items():
        if count >= 5:
            red_flags.append(f"Persistent {compensation. replace('_', ' ')} ({count} occurrences)")
    
    return PatientAnalytics(
        patient_id=patient_obj.patient_id,
        patient_name=f"{user_obj.first_name} {user_obj.last_name}",
        injury_type=patient_obj.injury_type,
        current_week=patient_obj.current_week,
        exercises=exercise_progress_list,
        overall_adherence=round(overall_adherence, 1),
        red_flags=red_flags
    )


@router.get("/pt-dashboard/{pt_id}", response_model=List[PTDashboardPatient])
async def get_pt_dashboard(pt_id: int, db: Session = Depends(get_db)):
    """
    Get summary of all patients for a physiotherapist
    Used by: PT Dashboard
    """
    # Get all patients assigned to this PT
    patients = db.query(Patient, User).join(
        User, Patient.user_id == User. user_id
    ).filter(Patient.assigned_pt_id == pt_id).all()
    
    patient_summaries = []
    
    for patient_obj, user_obj in patients: 
        # Get last session
        last_session = db.query(ExerciseSession. start_time).filter(
            ExerciseSession.patient_id == patient_obj.patient_id
        ).order_by(desc(ExerciseSession.start_time)).first()
        
        # Calculate adherence
        total_sessions = db.query(func.count(ExerciseSession. session_id)).filter(
            ExerciseSession.patient_id == patient_obj.patient_id,
            ExerciseSession. completed == True
        ).scalar()
        
        exercise_count = db.query(func.count(func.distinct(ExerciseSession. exercise_id))).filter(
            ExerciseSession.patient_id == patient_obj.patient_id
        ).scalar()
        
        expected_sessions = patient_obj.current_week * 3 * max(exercise_count, 1)
        adherence_rate = min((total_sessions / expected_sessions * 100) if expected_sessions > 0 else 0, 100)
        
        # Count red flags (simplified)
        red_flags_count = 0
        
        # Low adherence
        if adherence_rate < 60:
            red_flags_count += 1
        
        # No recent activity
        if last_session and (datetime.utcnow() - last_session[0]).days > 3:
            red_flags_count += 1
        
        # High severity feedback
        high_severity_count = db.query(func.count(FeedbackLog. feedback_id)).join(
            ExerciseSession, FeedbackLog.session_id == ExerciseSession.session_id
        ).filter(
            ExerciseSession.patient_id == patient_obj.patient_id,
            FeedbackLog.severity == 'high'
        ).scalar()
        
        if high_severity_count > 10:
            red_flags_count += 1
        
        patient_summaries.append(PTDashboardPatient(
            patient_id=patient_obj.patient_id,
            user_id=user_obj.user_id,
            full_name=f"{user_obj.first_name} {user_obj.last_name}",
            injury_type=patient_obj.injury_type,
            current_week=patient_obj.current_week,
            last_session=last_session[0] if last_session else None,
            adherence_rate=round(adherence_rate, 1),
            red_flags_count=red_flags_count
        ))
    
    # Sort by red flags (most urgent first)
    patient_summaries.sort(key=lambda x: x.red_flags_count, reverse=True)
    
    return patient_summaries


@router.get("/rom-history/{patient_id}/{exercise_id}")
async def get_rom_history(
    patient_id: int,
    exercise_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get detailed ROM history for charting
    Returns daily max ROM values
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all sessions in date range
    sessions = db.query(ExerciseSession).filter(
        ExerciseSession.patient_id == patient_id,
        ExerciseSession.exercise_id == exercise_id,
        ExerciseSession.start_time >= cutoff_date,
        ExerciseSession.completed == True
    ).order_by(ExerciseSession. start_time).all()
    
    rom_history = []
    
    for session in sessions:
        # Get movement data
        movement_data = db.query(MovementData).filter(
            MovementData.session_id == session.session_id
        ).all()
        
        if movement_data and movement_data[0].joint_angles:
            first_angle = list(movement_data[0]. joint_angles.keys())[0]
            rom_values = [md.joint_angles.get(first_angle, 0) for md in movement_data]
            
            if rom_values:
                rom_history.append({
                    'date': session.start_time.isoformat(),
                    'max_rom':  round(max(rom_values), 1),
                    'avg_rom': round(sum(rom_values) / len(rom_values), 1),
                    'quality_score': session.average_quality_score
                })
    
    return {
        'patient_id': patient_id,
        'exercise_id': exercise_id,
        'data': rom_history
    }


@router.get("/feedback-summary/{session_id}")
async def get_feedback_summary(session_id:  int, db: Session = Depends(get_db)):
    """
    Get summary of all feedback for a session
    Useful for reviewing what went wrong
    """
    feedback_logs = db.query(FeedbackLog).filter(
        FeedbackLog.session_id == session_id
    ).all()
    
    # Group by category
    feedback_by_category = {}
    
    for log in feedback_logs:
        category = log.feedback_category or log.feedback_type
        
        if category not in feedback_by_category:
            feedback_by_category[category] = {
                'count': 0,
                'severity_distribution': {'low': 0, 'medium':  0, 'high': 0},
                'example_message': log.feedback_message
            }
        
        feedback_by_category[category]['count'] += 1
        feedback_by_category[category]['severity_distribution'][log.severity] += 1
    
    return {
        'session_id': session_id,
        'total_feedback_count': len(feedback_logs),
        'by_category': feedback_by_category
    }


@router.post("/update-week/{patient_id}")
async def update_patient_week(
    patient_id: int,
    new_week: int,
    db: Session = Depends(get_db)
):
    """
    Update patient's current week (used by PT)
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    patient.current_week = new_week
    db.commit()
    
    return SuccessResponse(
        message=f"Patient week updated to {new_week}",
        data={'patient_id': patient_id, 'current_week': new_week}
    )