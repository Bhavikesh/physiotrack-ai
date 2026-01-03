"""
Data Retention and Cleanup Service
Manages database storage by archiving and cleaning up old data
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import json
import gzip
import os
from typing import Dict, List

from app.database import get_db
from app.models import MovementData, FeedbackLog, ExerciseSession, ProgressMetric


class DataRetentionService:
    """
    Manages data lifecycle to prevent database bloat
    
    Retention Policy:
    - Raw movement data: 30 days (then archive)
    - Feedback logs: 90 days (then aggregate)
    - Session metadata: Keep forever
    - Archived data: Compress and move to file storage
    """
    
    def __init__(self, db: Session, archive_path: str = "./data_archives"):
        self.db = db
        self.archive_path = archive_path
        os.makedirs(archive_path, exist_ok=True)
    
    
    def cleanup_old_movement_data(self, days_to_keep: int = 30) -> Dict:
        """
        Archive and remove movement data older than specified days
        
        Movement data is the largest table - each session can have 5000+ records
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Find old movement data
        old_data = self.db.query(MovementData).filter(
            MovementData.timestamp < cutoff_date
        ).all()
        
        if not old_data:
            return {
                "status": "success",
                "archived_records": 0,
                "deleted_records": 0,
                "message": "No old movement data to archive"
            }
        
        # Group by session for archiving
        sessions_to_archive = {}
        for record in old_data:
            session_id = record.session_id
            if session_id not in sessions_to_archive:
                sessions_to_archive[session_id] = []
            sessions_to_archive[session_id].append({
                "timestamp": record.timestamp.isoformat(),
                "frame_number": record.frame_number,
                "joint_angles": record.joint_angles,
                "quality_score": record.quality_score
            })
        
        # Archive to compressed files
        archived_sessions = 0
        for session_id, data in sessions_to_archive.items():
            archive_file = os.path.join(
                self.archive_path, 
                f"movement_data_session_{session_id}_{datetime.now().strftime('%Y%m%d')}.json.gz"
            )
            
            with gzip.open(archive_file, 'wt', encoding='utf-8') as f:
                json.dump(data, f)
            
            archived_sessions += 1
        
        # Delete from database
        deleted_count = self.db.query(MovementData).filter(
            MovementData.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        return {
            "status": "success",
            "archived_records": len(old_data),
            "deleted_records": deleted_count,
            "archived_sessions": archived_sessions,
            "archive_path": self.archive_path,
            "cutoff_date": cutoff_date.isoformat()
        }
    
    
    def aggregate_and_cleanup_feedback_logs(self, days_to_keep: int = 90) -> Dict:
        """
        Aggregate old feedback logs into summary and remove raw data
        
        Keeps summary statistics but removes individual feedback records
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Find old feedback logs
        old_logs = self.db.query(FeedbackLog).filter(
            FeedbackLog.timestamp < cutoff_date
        ).all()
        
        if not old_logs:
            return {
                "status": "success",
                "aggregated_records": 0,
                "message": "No old feedback logs to aggregate"
            }
        
        # Aggregate by session
        session_summaries = {}
        for log in old_logs:
            session_id = log.session_id
            if session_id not in session_summaries:
                session_summaries[session_id] = {
                    "total_feedback": 0,
                    "by_type": {},
                    "by_severity": {"low": 0, "medium": 0, "high": 0},
                    "most_common_issues": []
                }
            
            summary = session_summaries[session_id]
            summary["total_feedback"] += 1
            
            # Count by type
            feedback_type = log.feedback_type or "unknown"
            summary["by_type"][feedback_type] = summary["by_type"].get(feedback_type, 0) + 1
            
            # Count by severity
            if log.severity in summary["by_severity"]:
                summary["by_severity"][log.severity] += 1
        
        # Save aggregated summaries to sessions table (as JSON in notes field)
        # Or create a new FeedbackSummary table
        aggregated_count = 0
        for session_id, summary in session_summaries.items():
            session = self.db.query(ExerciseSession).filter(
                ExerciseSession.session_id == session_id
            ).first()
            
            if session:
                # Store summary in session notes or create separate summary record
                if session.notes:
                    session.notes += f"\n\n[FEEDBACK_SUMMARY]: {json.dumps(summary)}"
                else:
                    session.notes = f"[FEEDBACK_SUMMARY]: {json.dumps(summary)}"
                aggregated_count += 1
        
        # Delete old feedback logs
        deleted_count = self.db.query(FeedbackLog).filter(
            FeedbackLog.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        return {
            "status": "success",
            "aggregated_sessions": aggregated_count,
            "deleted_records": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
    
    
    def compute_weekly_metrics(self) -> Dict:
        """
        Pre-compute weekly metrics to avoid repeated expensive queries
        
        This populates the progress_metrics table for fast analytics
        """
        # Get all patients
        sessions = self.db.query(ExerciseSession).filter(
            ExerciseSession.completed == True
        ).all()
        
        # Group by patient, exercise, and week
        metrics_by_patient = {}
        
        for session in sessions:
            key = (session.patient_id, session.exercise_id)
            if key not in metrics_by_patient:
                metrics_by_patient[key] = {}
            
            # Determine week number (simplified - use patient's current_week or calculate from start_time)
            week = 1  # You'd calculate this properly
            
            if week not in metrics_by_patient[key]:
                metrics_by_patient[key][week] = {
                    "sessions": [],
                    "total_reps": 0,
                    "quality_scores": []
                }
            
            metrics_by_patient[key][week]["sessions"].append(session)
            metrics_by_patient[key][week]["total_reps"] += session.total_reps or 0
            if session.average_quality_score:
                metrics_by_patient[key][week]["quality_scores"].append(session.average_quality_score)
        
        # Save to progress_metrics table
        created_count = 0
        for (patient_id, exercise_id), weeks in metrics_by_patient.items():
            for week, data in weeks.items():
                # Check if metric exists
                existing = self.db.query(ProgressMetric).filter(
                    and_(
                        ProgressMetric.patient_id == patient_id,
                        ProgressMetric.exercise_id == exercise_id,
                        ProgressMetric.week_number == week
                    )
                ).first()
                
                if not existing:
                    new_metric = ProgressMetric(
                        patient_id=patient_id,
                        exercise_id=exercise_id,
                        week_number=week,
                        total_sessions=len(data["sessions"]),
                        average_rom=0,  # Calculate from movement data if needed
                        max_rom=0,
                        adherence_rate=0,  # Calculate based on prescribed frequency
                        quality_score_trend=sum(data["quality_scores"]) / len(data["quality_scores"]) if data["quality_scores"] else 0
                    )
                    self.db.add(new_metric)
                    created_count += 1
        
        self.db.commit()
        
        return {
            "status": "success",
            "metrics_created": created_count
        }
    
    
    def get_storage_statistics(self) -> Dict:
        """
        Get current database storage usage by table
        """
        movement_count = self.db.query(func.count(MovementData.movement_id)).scalar()
        feedback_count = self.db.query(func.count(FeedbackLog.feedback_id)).scalar()
        session_count = self.db.query(func.count(ExerciseSession.session_id)).scalar()
        
        # Estimate sizes (rough approximation)
        # Average row sizes: MovementData ~2KB, FeedbackLog ~500B
        movement_size_mb = (movement_count * 2) / 1024
        feedback_size_mb = (feedback_count * 0.5) / 1024
        
        return {
            "movement_data": {
                "count": movement_count,
                "estimated_size_mb": round(movement_size_mb, 2)
            },
            "feedback_logs": {
                "count": feedback_count,
                "estimated_size_mb": round(feedback_size_mb, 2)
            },
            "sessions": {
                "count": session_count
            },
            "total_estimated_mb": round(movement_size_mb + feedback_size_mb, 2)
        }
    
    
    def full_cleanup(self, movement_days: int = 30, feedback_days: int = 90) -> Dict:
        """
        Run all cleanup operations
        """
        results = {}
        
        # Get initial stats
        results["before"] = self.get_storage_statistics()
        
        # Cleanup movement data
        results["movement_cleanup"] = self.cleanup_old_movement_data(movement_days)
        
        # Cleanup feedback logs
        results["feedback_cleanup"] = self.aggregate_and_cleanup_feedback_logs(feedback_days)
        
        # Compute metrics
        results["metrics_computed"] = self.compute_weekly_metrics()
        
        # Get final stats
        results["after"] = self.get_storage_statistics()
        
        # Calculate savings
        if results["before"]["total_estimated_mb"] > 0:
            saved_mb = results["before"]["total_estimated_mb"] - results["after"]["total_estimated_mb"]
            saved_percentage = (saved_mb / results["before"]["total_estimated_mb"]) * 100
            results["savings"] = {
                "mb_saved": round(saved_mb, 2),
                "percentage": round(saved_percentage, 1)
            }
        
        return results


# Standalone cleanup function for scheduled jobs
def run_scheduled_cleanup():
    """
    Run this function on a schedule (e.g., daily at 2 AM)
    """
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        service = DataRetentionService(db)
        results = service.full_cleanup(
            movement_days=30,  # Keep raw movement data for 30 days
            feedback_days=90   # Keep feedback logs for 90 days
        )
        
        print("✅ Cleanup completed successfully")
        print(f"   - Movement data archived: {results['movement_cleanup']['archived_records']} records")
        print(f"   - Feedback logs aggregated: {results['feedback_cleanup']['aggregated_records']} records")
        print(f"   - Space saved: {results.get('savings', {}).get('mb_saved', 0)} MB")
        
        return results
    except Exception as e:
        print(f"❌ Cleanup failed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Test the cleanup
    run_scheduled_cleanup()
