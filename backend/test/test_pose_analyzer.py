"""
Unit Tests for Pose Analyzer
"""

import pytest
import math
from app.pose_analyzer import PoseAnalyzer, calculate_angle_simple


def test_angle_calculation_90_degrees():
    """Test angle calculation for 90 degree angle"""
    # Create three points forming 90 degree angle
    p1 = {'x': 0.0, 'y': 0.0, 'z': 0.0, 'visibility': 1.0}  # Point A
    p2 = {'x': 1.0, 'y': 0.0, 'z': 0.0, 'visibility': 1.0}  # Point B (vertex)
    p3 = {'x': 1.0, 'y': 1.0, 'z':  0.0, 'visibility': 1.0}  # Point C
    
    angle = calculate_angle_simple(p1, p2, p3)
    
    assert 89.0 <= angle <= 91.0, f"Expected ~90°, got {angle}°"


def test_angle_calculation_180_degrees():
    """Test angle calculation for straight line (180 degrees)"""
    p1 = {'x': 0.0, 'y': 0.0, 'z':  0.0, 'visibility': 1.0}
    p2 = {'x':  0.5, 'y': 0.0, 'z': 0.0, 'visibility': 1.0}
    p3 = {'x': 1.0, 'y': 0.0, 'z': 0.0, 'visibility':  1.0}
    
    angle = calculate_angle_simple(p1, p2, p3)
    
    assert 179.0 <= angle <= 180.0, f"Expected ~180°, got {angle}°"


def test_angle_calculation_45_degrees():
    """Test angle calculation for 45 degree angle"""
    p1 = {'x': 0.0, 'y': 0.0, 'z': 0.0, 'visibility': 1.0}
    p2 = {'x': 1.0, 'y': 0.0, 'z':  0.0, 'visibility': 1.0}
    p3 = {'x': 2.0, 'y': 1.0, 'z': 0.0, 'visibility':  1.0}
    
    angle = calculate_angle_simple(p1, p2, p3)
    
    assert 44.0 <= angle <= 46.0, f"Expected ~45°, got {angle}°"


def test_pose_analyzer_initialization():
    """Test PoseAnalyzer initialization"""
    analyzer = PoseAnalyzer('shoulder_flexion')
    
    assert analyzer.exercise_id == 'shoulder_flexion'
    assert analyzer.rep_count == 0
    assert analyzer.quality_reps == 0
    assert analyzer.current_state == 'resting'


def test_pose_analyzer_reset():
    """Test PoseAnalyzer reset functionality"""
    analyzer = PoseAnalyzer('shoulder_flexion')
    
    # Modify state
    analyzer.rep_count = 5
    analyzer.quality_reps = 3
    analyzer.current_state = 'raising'
    
    # Reset
    analyzer.reset()
    
    assert analyzer.rep_count == 0
    assert analyzer.quality_reps == 0
    assert analyzer.current_state == 'resting'


def test_quality_score_perfect_form():
    """Test quality score calculation with perfect form"""
    analyzer = PoseAnalyzer('shoulder_flexion')
    
    angles = {'shoulder_angle': 180, 'elbow_angle': 180}
    feedback = []  # No feedback = perfect form
    
    score = analyzer._calculate_quality_score(angles, feedback)
    
    assert score == 100.0, f"Expected 100, got {score}"


def test_quality_score_with_feedback():
    """Test quality score calculation with feedback"""
    analyzer = PoseAnalyzer('shoulder_flexion')
    
    angles = {'shoulder_angle': 170, 'elbow_angle':  165}
    feedback = [
        {'severity': 'medium', 'message': 'Elbow bent'},
        {'severity': 'low', 'message': 'Slightly lower ROM'}
    ]
    
    score = analyzer._calculate_quality_score(angles, feedback)
    
    assert score < 100.0, "Score should be less than 100 with feedback"
    assert score >= 0.0, "Score should not be negative"


def test_compensation_detection():
    """Test compensation detection"""
    analyzer = PoseAnalyzer('shoulder_flexion')
    
    # Create landmarks with bent elbow (compensation)
    landmarks = [{'x': 0.0, 'y': 0.0, 'z': 0.0, 'visibility': 1.0}] * 33
    
    # Set specific landmarks for elbow bend
    landmarks[11] = {'x': 0.5, 'y': 0.3, 'z': 0.0, 'visibility': 1.0}  # Shoulder
    landmarks[13] = {'x': 0.6, 'y': 0.5, 'z': 0.0, 'visibility': 1.0}  # Elbow
    landmarks[15] = {'x': 0.7, 'y': 0.6, 'z': 0.0, 'visibility':  1.0}  # Wrist (bent)
    
    angles = {'elbow_angle': 160}  # Bent elbow
    
    compensations = analyzer._detect_compensations(landmarks, angles)
    
    # Should detect elbow bend compensation
    assert len(compensations) > 0, "Should detect compensation"
    assert any('elbow' in str(comp).lower() for comp in compensations)


if __name__ == "__main__": 
    pytest.main([__file__, "-v"])