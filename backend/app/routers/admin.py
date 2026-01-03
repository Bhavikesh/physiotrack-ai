"""
Admin API Routes for Database Management
Endpoints for cleanup, archiving, and storage monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.data_retention import DataRetentionService
from pydantic import BaseModel


router = APIRouter()


class CleanupRequest(BaseModel):
    movement_data_days: int = 30
    feedback_logs_days: int = 90
    run_async: bool = False


class CleanupResponse(BaseModel):
    status: str
    message: str
    details: dict


@router.get("/storage-stats")
async def get_storage_statistics(db: Session = Depends(get_db)):
    """
    Get current database storage usage statistics
    """
    service = DataRetentionService(db)
    stats = service.get_storage_statistics()
    
    return {
        "status": "success",
        "data": stats,
        "recommendations": generate_recommendations(stats)
    }


@router.post("/cleanup", response_model=CleanupResponse)
async def trigger_cleanup(
    request: CleanupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger data cleanup and archiving
    
    Parameters:
    - movement_data_days: Keep movement data for this many days (default: 30)
    - feedback_logs_days: Keep feedback logs for this many days (default: 90)
    - run_async: Run cleanup in background (default: False)
    """
    service = DataRetentionService(db)
    
    if request.run_async:
        # Run in background
        background_tasks.add_task(
            service.full_cleanup,
            request.movement_data_days,
            request.feedback_logs_days
        )
        return CleanupResponse(
            status="accepted",
            message="Cleanup job queued and will run in background",
            details={"async": True}
        )
    else:
        # Run synchronously
        try:
            results = service.full_cleanup(
                request.movement_data_days,
                request.feedback_logs_days
            )
            return CleanupResponse(
                status="success",
                message="Cleanup completed successfully",
                details=results
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


@router.post("/archive-movement-data")
async def archive_movement_data(
    days_to_keep: int = 30,
    db: Session = Depends(get_db)
):
    """
    Archive old movement data to compressed files
    """
    service = DataRetentionService(db)
    result = service.cleanup_old_movement_data(days_to_keep)
    
    return {
        "status": "success",
        "data": result
    }


@router.post("/aggregate-feedback-logs")
async def aggregate_feedback_logs(
    days_to_keep: int = 90,
    db: Session = Depends(get_db)
):
    """
    Aggregate old feedback logs into summaries
    """
    service = DataRetentionService(db)
    result = service.aggregate_and_cleanup_feedback_logs(days_to_keep)
    
    return {
        "status": "success",
        "data": result
    }


@router.post("/compute-metrics")
async def compute_weekly_metrics(db: Session = Depends(get_db)):
    """
    Pre-compute weekly progress metrics for faster analytics
    """
    service = DataRetentionService(db)
    result = service.compute_weekly_metrics()
    
    return {
        "status": "success",
        "data": result
    }


def generate_recommendations(stats: dict) -> list:
    """
    Generate recommendations based on storage statistics
    """
    recommendations = []
    
    movement_mb = stats["movement_data"]["estimated_size_mb"]
    feedback_mb = stats["feedback_logs"]["estimated_size_mb"]
    
    if movement_mb > 1000:  # Over 1 GB
        recommendations.append({
            "severity": "high",
            "message": f"Movement data is using {movement_mb:.0f} MB. Consider running cleanup to archive old data.",
            "action": "Run cleanup for movement data older than 30 days"
        })
    elif movement_mb > 500:  # Over 500 MB
        recommendations.append({
            "severity": "medium",
            "message": f"Movement data is using {movement_mb:.0f} MB. Cleanup recommended soon.",
            "action": "Schedule cleanup for next maintenance window"
        })
    
    if feedback_mb > 100:  # Over 100 MB
        recommendations.append({
            "severity": "medium",
            "message": f"Feedback logs are using {feedback_mb:.0f} MB. Consider aggregating old logs.",
            "action": "Aggregate feedback logs older than 90 days"
        })
    
    if not recommendations:
        recommendations.append({
            "severity": "info",
            "message": "Database storage is healthy. No immediate action needed.",
            "action": "Continue monitoring"
        })
    
    return recommendations
