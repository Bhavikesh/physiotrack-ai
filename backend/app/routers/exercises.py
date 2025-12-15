"""
Exercise Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Exercise
from app.schemas import ExerciseResponse, ExerciseWithRules, SuccessResponse
from app.exercise_rules import get_exercise_rules, get_available_exercises

router = APIRouter()


@router.get("/", response_model=List[ExerciseResponse])
async def list_exercises(
    category: str = None,
    difficulty: str = None,
    db: Session = Depends(get_db)
):
    """
    Get list of all available exercises
    
    Query parameters:
    - category: Filter by category (e.g., 'upper_body', 'lower_body')
    - difficulty: Filter by difficulty (e.g., 'beginner', 'intermediate')
    """
    query = db.query(Exercise)
    
    if category: 
        query = query.filter(Exercise.category == category)
    
    if difficulty:
        query = query.filter(Exercise.difficulty == difficulty)
    
    exercises = query.all()
    
    # If database is empty, return from exercise_rules
    if not exercises: 
        available = get_available_exercises()
        return [
            ExerciseResponse(
                exercise_id=idx + 1,
                exercise_code=ex['id'],
                name=ex['name'],
                description=ex['description'],
                target_rom=ex['target_rom'],
                category="general",
                difficulty="beginner"
            )
            for idx, ex in enumerate(available)
        ]
    
    return exercises


@router.get("/{exercise_id}", response_model=ExerciseWithRules)
async def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific exercise including clinical rules
    """
    exercise = db.query(Exercise).filter(Exercise.exercise_id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found"
        )
    
    # Get clinical rules
    try:
        rules = get_exercise_rules(exercise. exercise_code)
    except ValueError:
        rules = {}
    
    return ExerciseWithRules(
        exercise_id=exercise. exercise_id,
        exercise_code=exercise.exercise_code,
        name=exercise.name,
        description=exercise.description,
        category=exercise.category,
        difficulty=exercise.difficulty,
        target_rom=exercise.target_rom,
        video_url=exercise.video_url,
        thumbnail_url=exercise.thumbnail_url,
        rules=rules
    )


@router.get("/code/{exercise_code}", response_model=ExerciseWithRules)
async def get_exercise_by_code(exercise_code: str, db: Session = Depends(get_db)):
    """
    Get exercise by code (e.g., 'shoulder_flexion')
    """
    exercise = db.query(Exercise).filter(Exercise.exercise_code == exercise_code).first()
    
    # If not in database, create from rules
    if not exercise: 
        try:
            rules = get_exercise_rules(exercise_code)
            exercise = Exercise(
                exercise_id=0,  # Temporary ID
                exercise_code=exercise_code,
                name=rules['name'],
                description=rules['description'],
                target_rom=rules['target_rom'],
                category=rules. get('category', 'general'),
                difficulty=rules.get('difficulty', 'beginner')
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercise '{exercise_code}' not found"
            )
    
    # Get clinical rules
    rules = get_exercise_rules(exercise. exercise_code)
    
    return ExerciseWithRules(
        exercise_id=exercise. exercise_id,
        exercise_code=exercise.exercise_code,
        name=exercise.name,
        description=exercise.description,
        category=exercise.category,
        difficulty=exercise.difficulty,
        target_rom=exercise. target_rom,
        video_url=exercise.video_url if hasattr(exercise, 'video_url') else None,
        thumbnail_url=exercise.thumbnail_url if hasattr(exercise, 'thumbnail_url') else None,
        rules=rules
    )