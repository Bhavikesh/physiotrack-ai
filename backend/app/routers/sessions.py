"""
Exercise Session Routes
Core functionality for real-time pose analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict
import json

from app.database import get_db
from app.models import ExerciseSession, Exercise, Patient, MovementData, FeedbackLog
from app. schemas import (
    SessionStart, SessionStartResponse, SessionEnd, SessionSummary,
    AnalyzeFrameRequest, AnalyzeFrameResponse, SessionHistory,
    MovementDataCreate, FeedbackLogCreate
)
from app.pose_analyzer import PoseAnalyzer
from app.exercise_rules import get_exercise_rules, get_available_exercises

router = APIRouter()

# Store active analyzers (in production, use Redis)
active_analyzers: Dict[int, PoseAnalyzer] = {}


@router.post("/start", response_model=SessionStartResponse)
async def start_session(session_data: SessionStart, db: Session = Depends(get_db)):
    """
    Start a new exercise session
    """
    # Verify patient exists
    patient = db. query(Patient).filter(Patient.patient_id == session_data. patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify exercise exists
    exercise = db.query(Exercise).filter(Exercise.exercise_id == session_data.exercise_id).first()
    if not exercise:
        # Try to get from rules
        available = get_available_exercises()
        if session_data.exercise_id <= len(available):
            exercise_code = available[session_data.exercise_id - 1]['id']
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exercise not found"
            )
    else:
        exercise_code = exercise.exercise_code
    
    # Create session
    new_session = ExerciseSession(
        patient_id=session_data.patient_id,
        exercise_id=session_data.exercise_id,
        start_time=datetime.utcnow(),
        completed=False
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Initialize pose analyzer
    analyzer = PoseAnalyzer(exercise_code)
    active_analyzers[new_session.session_id] = analyzer
    
    # Get exercise rules
    rules = get_exercise_rules(exercise_code)
    
    return SessionStartResponse(
        session_id=new_session.session_id,
        exercise_code=exercise_code,
        exercise_rules=rules,
        started_at=new_session.start_time
    )


@router.post("/analyze-frame", response_model=AnalyzeFrameResponse)
async def analyze_frame(frame_data: AnalyzeFrameRequest, db: Session = Depends(get_db)):
    """
    Analyze a single frame of pose data
    This is called 30 times per second during exercise
    """
    # Get session
    session = db.query(ExerciseSession).filter(
        ExerciseSession.session_id == frame_data.session_id
    ).first()
    
    if not session: 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get analyzer
    analyzer = active_analyzers.get(frame_data.session_id)
    if not analyzer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session not active.  Please start session first."
        )
    
    # Convert landmarks to dict format
    landmarks_dict = [
        {
            'x': lm.x,
            'y': lm.y,
            'z': lm. z,
            'visibility': lm.visibility
        }
        for lm in frame_data.landmarks
    ]
    
    # Analyze frame
    analysis_result = analyzer.analyze_frame(landmarks_dict, frame_data.timestamp)
    
    # Save movement data (only every 5th frame to reduce DB load)
    if frame_data.frame_number and frame_data.frame_number % 5 == 0:
        movement_data = MovementData(
            session_id=frame_data.session_id,
            timestamp=datetime.fromtimestamp(frame_data. timestamp),
            frame_number=frame_data.frame_number,
            joint_angles=analysis_result['angles'],
            quality_score=analysis_result['quality_score']
        )
        db.add(movement_data)
    
    # Save feedback logs
    for feedback_item in analysis_result['feedback']: 
        feedback_log = FeedbackLog(
            session_id=frame_data.session_id,
            timestamp=datetime.fromtimestamp(frame_data.timestamp),
            feedback_type=feedback_item['type'],
            feedback_category=feedback_item. get('category'),
            feedback_message=feedback_item['message'],
            severity=feedback_item['severity'],
            current_value=feedback_item. get('current_value'),
            threshold_value=float(feedback_item['threshold']. split('-')[0]) if isinstance(feedback_item. get('threshold'), str) else None
        )
        db.add(feedback_log)
    
    # Commit every 10 frames
    if frame_data.frame_number and frame_data.frame_number % 10 == 0:
        db.commit()
    
    # Return analysis
    return AnalyzeFrameResponse(
        angles=analysis_result['angles'],
        feedback=analysis_result['feedback'],
        rep_count=analysis_result['rep_count'],
        quality_reps=analysis_result['quality_reps'],
        state=analysis_result['state'],
        quality_score=analysis_result['quality_score'],
        timestamp=analysis_result['timestamp']
    )


@router.post("/end", response_model=SessionSummary)
async def end_session(end_data: SessionEnd, db:  Session = Depends(get_db)):
    """
    End an exercise session and generate summary
    """
    # Get session
    session = db.query(ExerciseSession).filter(
        ExerciseSession.session_id == end_data.session_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get analyzer for final stats
    analyzer = active_analyzers.get(end_data.session_id)
    if analyzer:
        session. total_reps = analyzer.rep_count
        session.quality_reps = analyzer.quality_reps
        
        # Remove from active analyzers
        del active_analyzers[end_data.session_id]
    
    # Update session
    session.end_time = datetime.utcnow()
    session.duration_seconds = int((session.end_time - session. start_time).total_seconds())
    session.completed = True
    
    if end_data.notes:
        session.notes = end_data.notes
    
    # Calculate average quality score
    movement_data = db.query(MovementData).filter(
        MovementData.session_id == end_data.session_id
    ).all()
    
    if movement_data:
        quality_scores = [md.quality_score for md in movement_data if md.quality_score]
        if quality_scores: 
            session.average_quality_score = sum(quality_scores) / len(quality_scores)
    
    # Get feedback summary
    feedback_logs = db.query(FeedbackLog).filter(
        FeedbackLog.session_id == end_data.session_id
    ).all()
    
    feedback_summary = {}
    for log in feedback_logs:
        category = log.feedback_category or log.feedback_type
        feedback_summary[category] = feedback_summary.get(category, 0) + 1
    
    # Get max ROM achieved
    rom_achieved = None
    if movement_data:
        # Get first angle name (primary joint)
        if movement_data[0].joint_angles:
            first_angle_name = list(movement_data[0].joint_angles.keys())[0]
            rom_values = [md.joint_angles. get(first_angle_name, 0) for md in movement_data]
            rom_achieved = max(rom_values) if rom_values else None
    
    db.commit()
    db.refresh(session)
    
    return SessionSummary(
        session_id=session.session_id,
        duration_seconds=session.duration_seconds,
        total_reps=session.total_reps,
        quality_reps=session. quality_reps,
        average_quality_score=session.average_quality_score or 0.0,
        feedback_summary=feedback_summary,
        rom_achieved=rom_achieved
    )


@router.get("/history/{patient_id}", response_model=List[SessionHistory])
async def get_session_history(
    patient_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get exercise session history for a patient
    """
    sessions = db.query(ExerciseSession, Exercise).join(
        Exercise, ExerciseSession.exercise_id == Exercise. exercise_id
    ).filter(
        ExerciseSession.patient_id == patient_id
    ).order_by(
        ExerciseSession.start_time.desc()
    ).limit(limit).all()
    
    return [
        SessionHistory(
            session_id=session. session_id,
            exercise_name=exercise.name,
            start_time=session.start_time,
            duration_seconds=session.duration_seconds,
            total_reps=session.total_reps,
            quality_reps=session.quality_reps,
            average_quality_score=session.average_quality_score,
            completed=session.completed
        )
        for session, exercise in sessions
    ]


@router.get("/{session_id}", response_model=SessionHistory)
async def get_session_detail(session_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific session
    """
    session = db.query(ExerciseSession, Exercise).join(
        Exercise, ExerciseSession.exercise_id == Exercise.exercise_id
    ).filter(
        ExerciseSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session_obj, exercise = session
    
    return SessionHistory(
        session_id=session_obj.session_id,
        exercise_name=exercise.name,
        start_time=session_obj.start_time,
        duration_seconds=session_obj.duration_seconds,
        total_reps=session_obj.total_reps,
        quality_reps=session_obj.quality_reps,
        average_quality_score=session_obj.average_quality_score,
        completed=session_obj.completed
    )