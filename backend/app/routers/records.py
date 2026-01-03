"""
Personal Records API Routes
Track and display patient achievements
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import PersonalRecord, Patient, ExerciseSession, Exercise, MovementData
from pydantic import BaseModel


router = APIRouter()


# Pydantic models
class PersonalRecordResponse(BaseModel):
    record_id: int
    record_type: str
    record_value: float
    exercise_name: Optional[str] = None
    achieved_at: datetime
    
    class Config:
        from_attributes = True


class PersonalRecordsSummary(BaseModel):
    best_quality_scores: List[PersonalRecordResponse]
    longest_streak: Optional[PersonalRecordResponse]
    most_reps: List[PersonalRecordResponse]
    best_rom: List[PersonalRecordResponse]


@router.get("/patient/{patient_id}/records", response_model=PersonalRecordsSummary)
async def get_personal_records(patient_id: int, db: Session = Depends(get_db)):
    """
    Get all personal records for a patient
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all records
    best_quality_scores = db.query(PersonalRecord, Exercise).join(
        Exercise, PersonalRecord.exercise_id == Exercise.exercise_id, isouter=True
    ).filter(
        PersonalRecord.patient_id == patient_id,
        PersonalRecord.record_type == 'best_quality_score'
    ).order_by(desc(PersonalRecord.record_value)).limit(5).all()
    
    longest_streak = db.query(PersonalRecord).filter(
        PersonalRecord.patient_id == patient_id,
        PersonalRecord.record_type == 'longest_streak'
    ).order_by(desc(PersonalRecord.record_value)).first()
    
    most_reps = db.query(PersonalRecord, Exercise).join(
        Exercise, PersonalRecord.exercise_id == Exercise.exercise_id, isouter=True
    ).filter(
        PersonalRecord.patient_id == patient_id,
        PersonalRecord.record_type == 'most_reps'
    ).order_by(desc(PersonalRecord.record_value)).limit(5).all()
    
    best_rom = db.query(PersonalRecord, Exercise).join(
        Exercise, PersonalRecord.exercise_id == Exercise.exercise_id, isouter=True
    ).filter(
        PersonalRecord.patient_id == patient_id,
        PersonalRecord.record_type == 'best_rom'
    ).order_by(desc(PersonalRecord.record_value)).limit(5).all()
    
    return PersonalRecordsSummary(
        best_quality_scores=[
            PersonalRecordResponse(
                record_id=record.record_id,
                record_type=record.record_type,
                record_value=record.record_value,
                exercise_name=exercise.name if exercise else None,
                achieved_at=record.achieved_at
            ) for record, exercise in best_quality_scores
        ],
        longest_streak=PersonalRecordResponse(
            record_id=longest_streak.record_id,
            record_type=longest_streak.record_type,
            record_value=longest_streak.record_value,
            achieved_at=longest_streak.achieved_at
        ) if longest_streak else None,
        most_reps=[
            PersonalRecordResponse(
                record_id=record.record_id,
                record_type=record.record_type,
                record_value=record.record_value,
                exercise_name=exercise.name if exercise else None,
                achieved_at=record.achieved_at
            ) for record, exercise in most_reps
        ],
        best_rom=[
            PersonalRecordResponse(
                record_id=record.record_id,
                record_type=record.record_type,
                record_value=record.record_value,
                exercise_name=exercise.name if exercise else None,
                achieved_at=record.achieved_at
            ) for record, exercise in best_rom
        ]
    )


@router.post("/session/{session_id}/update-records")
async def update_records_after_session(session_id: int, db: Session = Depends(get_db)):
    """
    Check and update personal records after a session completes
    """
    session = db.query(ExerciseSession).filter(
        ExerciseSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    patient_id = session.patient_id
    exercise_id = session.exercise_id
    updated_records = []
    
    # Check best quality score
    if session.average_quality_score:
        existing_record = db.query(PersonalRecord).filter(
            PersonalRecord.patient_id == patient_id,
            PersonalRecord.exercise_id == exercise_id,
            PersonalRecord.record_type == 'best_quality_score'
        ).first()
        
        if not existing_record or session.average_quality_score > existing_record.record_value:
            if existing_record:
                existing_record.record_value = session.average_quality_score
                existing_record.session_id = session_id
                existing_record.achieved_at = session.end_time or datetime.utcnow()
            else:
                new_record = PersonalRecord(
                    patient_id=patient_id,
                    exercise_id=exercise_id,
                    record_type='best_quality_score',
                    record_value=session.average_quality_score,
                    session_id=session_id,
                    achieved_at=session.end_time or datetime.utcnow()
                )
                db.add(new_record)
            updated_records.append('best_quality_score')
    
    # Check most reps
    if session.total_reps:
        existing_record = db.query(PersonalRecord).filter(
            PersonalRecord.patient_id == patient_id,
            PersonalRecord.exercise_id == exercise_id,
            PersonalRecord.record_type == 'most_reps'
        ).first()
        
        if not existing_record or session.total_reps > existing_record.record_value:
            if existing_record:
                existing_record.record_value = session.total_reps
                existing_record.session_id = session_id
                existing_record.achieved_at = session.end_time or datetime.utcnow()
            else:
                new_record = PersonalRecord(
                    patient_id=patient_id,
                    exercise_id=exercise_id,
                    record_type='most_reps',
                    record_value=session.total_reps,
                    session_id=session_id,
                    achieved_at=session.end_time or datetime.utcnow()
                )
                db.add(new_record)
            updated_records.append('most_reps')
    
    # Check best ROM
    movement_data = db.query(MovementData).filter(
        MovementData.session_id == session_id
    ).all()
    
    if movement_data:
        max_rom = 0
        for md in movement_data:
            if md.joint_angles:
                rom_values = list(md.joint_angles.values())
                if rom_values:
                    max_rom = max(max_rom, max(rom_values))
        
        if max_rom > 0:
            existing_record = db.query(PersonalRecord).filter(
                PersonalRecord.patient_id == patient_id,
                PersonalRecord.exercise_id == exercise_id,
                PersonalRecord.record_type == 'best_rom'
            ).first()
            
            if not existing_record or max_rom > existing_record.record_value:
                if existing_record:
                    existing_record.record_value = max_rom
                    existing_record.session_id = session_id
                    existing_record.achieved_at = session.end_time or datetime.utcnow()
                else:
                    new_record = PersonalRecord(
                        patient_id=patient_id,
                        exercise_id=exercise_id,
                        record_type='best_rom',
                        record_value=max_rom,
                        session_id=session_id,
                        achieved_at=session.end_time or datetime.utcnow()
                    )
                    db.add(new_record)
                updated_records.append('best_rom')
    
    # Calculate and update streak
    current_streak = calculate_current_streak(patient_id, db)
    existing_streak = db.query(PersonalRecord).filter(
        PersonalRecord.patient_id == patient_id,
        PersonalRecord.record_type == 'longest_streak'
    ).first()
    
    if not existing_streak or current_streak > existing_streak.record_value:
        if existing_streak:
            existing_streak.record_value = current_streak
            existing_streak.achieved_at = datetime.utcnow()
        else:
            new_record = PersonalRecord(
                patient_id=patient_id,
                record_type='longest_streak',
                record_value=current_streak,
                achieved_at=datetime.utcnow()
            )
            db.add(new_record)
        updated_records.append('longest_streak')
    
    db.commit()
    
    return {
        "message": "Personal records updated",
        "updated_records": updated_records,
        "current_streak": current_streak
    }


def calculate_current_streak(patient_id: int, db: Session) -> int:
    """Calculate the current consecutive days streak"""
    # Get all completed sessions ordered by date
    sessions = db.query(ExerciseSession).filter(
        ExerciseSession.patient_id == patient_id,
        ExerciseSession.completed == True
    ).order_by(desc(ExerciseSession.start_time)).all()
    
    if not sessions:
        return 0
    
    # Get unique dates
    session_dates = set()
    for session in sessions:
        date = session.start_time.date()
        session_dates.add(date)
    
    # Sort dates descending
    sorted_dates = sorted(session_dates, reverse=True)
    
    # Check for consecutive days
    streak = 0
    expected_date = datetime.utcnow().date()
    
    for date in sorted_dates:
        if date == expected_date or date == expected_date - timedelta(days=1):
            streak += 1
            expected_date = date - timedelta(days=1)
        else:
            break
    
    return streak
