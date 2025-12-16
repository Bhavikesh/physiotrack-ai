"""
Pose Analyzer - Core Biomechanics Engine
Analyzes movement quality based on clinical parameters
"""

import numpy as np
import math
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from app.exercise_rules import get_exercise_rules


class PoseAnalyzer: 
    """
    Main class for analyzing exercise form and providing feedback
    """
    
    def __init__(self, exercise_id: str, weeks_post_surgery: int = None):
        """
        Initialize analyzer with specific exercise rules
        
        Args:
            exercise_id: Exercise identifier (e.g., 'shoulder_flexion')
            weeks_post_surgery: Number of weeks since surgery (if applicable)
        """
        self.exercise_rules = get_exercise_rules(exercise_id)
        self.exercise_id = exercise_id
        self.weeks_post_surgery = weeks_post_surgery
        
        # Adjust parameters for post-surgery patients
        if weeks_post_surgery is not None:
            self._adjust_for_surgery(weeks_post_surgery)
        
        # State tracking
        self.rep_count = 0
        self.quality_reps = 0
        self.current_state = "resting"
        self.state_start_time = None
        
        # History for velocity calculation
        self.angle_history = []
        self. max_history_length = 10
        
        # Feedback tracking
        self.current_rep_feedback = []
        self.previous_angle = None
    
    
    def _adjust_for_surgery(self, weeks: int):
        """
        Adjust exercise parameters based on weeks post-surgery
        
        Args:
            weeks: Number of weeks since surgery
        """
        print(f"⚕️ Adjusting parameters for {weeks} weeks post-surgery")
        
        # Reduce ROM targets for recent surgery
        if weeks < 4:
            # 0-4 weeks: Very limited ROM (50% of target)
            reduction_factor = 0.5
            print("   Phase: Early healing - 50% ROM")
        elif weeks < 8:
            # 4-8 weeks: Moderate ROM (70% of target)
            reduction_factor = 0.7
            print("   Phase: Progressive healing - 70% ROM")
        elif weeks < 12:
            # 8-12 weeks: Near normal ROM (85% of target)
            reduction_factor = 0.85
            print("   Phase: Advanced healing - 85% ROM")
        else:
            # 12+ weeks: Full ROM expected
            reduction_factor = 1.0
            print("   Phase: Full recovery - 100% ROM")
        
        # Adjust target ROM
        original_rom = self.exercise_rules['target_rom']
        self.exercise_rules['target_rom'] = int(original_rom * reduction_factor)
        
        # Adjust acceptable range
        lower, upper = self.exercise_rules['acceptable_range']
        self.exercise_rules['acceptable_range'] = (
            int(lower * reduction_factor),
            int(upper * reduction_factor)
        )
        
        # Reduce velocity requirements (slower movement)
        if 'velocity' in self.exercise_rules:
            conc_lower, conc_upper = self.exercise_rules['velocity']['concentric']
            ecc_lower, ecc_upper = self.exercise_rules['velocity']['eccentric']
            
            self.exercise_rules['velocity']['concentric'] = (
                int(conc_lower * 0.7),  # Slower movement post-surgery
                int(conc_upper * 0.8)
            )
            self.exercise_rules['velocity']['eccentric'] = (
                int(ecc_lower * 0.7),
                int(ecc_upper * 0.8)
            )
        
        # Increase hold duration for healing
        if weeks < 8 and 'hold_duration' in self.exercise_rules:
            self.exercise_rules['hold_duration']['end_range'] += 1
        
        print(f"   Adjusted ROM: {original_rom}° → {self.exercise_rules['target_rom']}°")
        print(f"   Acceptable range: {self.exercise_rules['acceptable_range']}")
    
    
    def analyze_frame(self, landmarks: List[Dict], timestamp: float) -> Dict:
        """
        Analyze a single frame of pose data
        
        Args: 
            landmarks: List of 33 pose landmarks from MediaPipe
                       Each landmark:  {'x': float, 'y': float, 'z': float, 'visibility': float}
            timestamp: Unix timestamp of frame
        
        Returns:
            Dictionary containing: 
                - angles: Calculated joint angles
                - feedback: List of corrective messages
                - rep_count: Total reps completed
                - quality_reps: Reps with good form
                - state: Current exercise state
                - quality_score: 0-100 score for current rep
        """
        print(f"🔍 Analyzing frame - Landmarks count: {len(landmarks)}")
        
        # Calculate joint angles
        angles = self._calculate_angles(landmarks)
        print(f"📐 Calculated angles: {angles}")
        
        # Check for compensations
        compensations = self._detect_compensations(landmarks, angles)
        
        # Update rep counter state machine
        rep_state = self._update_rep_counter(angles, timestamp)
        
        # Check movement velocity
        velocity_feedback = self._check_velocity(angles, timestamp)
        
        # Combine all feedback
        all_feedback = compensations + velocity_feedback
        
        # Calculate quality score
        quality_score = self._calculate_quality_score(angles, all_feedback)
        
        return {
            'angles':  angles,
            'feedback': all_feedback,
            'rep_count': self.rep_count,
            'quality_reps': self.quality_reps,
            'state': self.current_state,
            'quality_score': quality_score,
            'timestamp': timestamp
        }
    
    
    def _calculate_angles(self, landmarks: List[Dict]) -> Dict[str, float]:
        """
        Calculate all relevant joint angles for the exercise
        
        Args: 
            landmarks: MediaPipe pose landmarks
        
        Returns: 
            Dictionary of angle names to values in degrees
        """
        angles = {}
        
        joints_config = self.exercise_rules.get('joints_to_track', {})
        print(f"🔧 Joints to track: {list(joints_config.keys())}")
        
        for joint_name, config in joints_config.items():
            point_indices = config['points']
            
            # Extract the three points needed for angle calculation
            if len(point_indices) == 3:
                try:
                    point_a = landmarks[point_indices[0]]
                    point_b = landmarks[point_indices[1]]
                    point_c = landmarks[point_indices[2]]
                    
                    angle = self._calculate_angle_between_points(point_a, point_b, point_c)
                    angles[config['name']] = round(angle, 2)
                    print(f"✅ {joint_name} ({config['name']}): {round(angle, 2)}°")
                except (IndexError, KeyError, TypeError) as e:
                    print(f"❌ Error calculating {joint_name}: {e}")
                    print(f"   Landmark structure: {type(landmarks[0]) if landmarks else 'empty'}")
                    angles[config['name']] = 0
        
        return angles
    
    
    def _calculate_angle_between_points(
        self, 
        point_a: Dict, 
        point_b: Dict, 
        point_c:  Dict
    ) -> float:
        """
        Calculate angle at point_b formed by point_a -> point_b -> point_c
        
        Args:
            point_a, point_b, point_c:  Landmarks with x, y, z coordinates
        
        Returns:
            Angle in degrees (0-180)
        """
        # Create vectors
        vector_ba = np.array([
            point_a['x'] - point_b['x'],
            point_a['y'] - point_b['y'],
            point_a['z'] - point_b['z']
        ])
        
        vector_bc = np.array([
            point_c['x'] - point_b['x'],
            point_c['y'] - point_b['y'],
            point_c['z'] - point_b['z']
        ])
        
        # Calculate magnitudes
        magnitude_ba = np.linalg.norm(vector_ba)
        magnitude_bc = np.linalg.norm(vector_bc)
        
        # Avoid division by zero
        if magnitude_ba < 1e-6 or magnitude_bc < 1e-6:
            return 0.0
        
        # Calculate dot product
        dot_product = np.dot(vector_ba, vector_bc)
        
        # Calculate angle
        cos_angle = dot_product / (magnitude_ba * magnitude_bc)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)  # Clamp to valid range
        
        angle_radians = np.arccos(cos_angle)
        angle_degrees = math.degrees(angle_radians)
        
        return angle_degrees
    
    
    def _detect_compensations(
        self, 
        landmarks:  List[Dict], 
        angles: Dict[str, float]
    ) -> List[Dict]:
        """
        Detect compensation patterns (incorrect movement strategies)
        
        Args: 
            landmarks:  Pose landmarks
            angles:  Calculated joint angles
        
        Returns: 
            List of compensation feedback messages
        """
        feedback = []
        
        compensation_checks = self.exercise_rules.get('compensation_checks', {})
        
        for comp_name, comp_config in compensation_checks.items():
            # Check angle-based compensations
            if comp_name == 'elbow_bend':
                elbow_angle = angles. get('elbow_angle', 180)
                max_bend = comp_config.get('max_angle', 15)
                
                # Elbow should be straight (180° = fully extended)
                if elbow_angle < (180 - max_bend):
                    feedback.append({
                        'type': 'compensation',
                        'category': comp_name,
                        'severity': 'medium',
                        'message': comp_config.get('feedback', 'Check your elbow position'),
                        'current_value': elbow_angle,
                        'threshold': 180 - max_bend
                    })
            
            elif comp_name == 'trunk_lean':
                # Calculate trunk angle (requires shoulder and hip landmarks)
                try:
                    shoulder = landmarks[11]  # Left shoulder
                    hip = landmarks[23]       # Left hip
                    
                    # Calculate deviation from vertical
                    trunk_deviation = abs(shoulder['x'] - hip['x'])
                    max_lean = comp_config.get('max_angle', 10) / 100  # Convert to normalized coordinates
                    
                    if trunk_deviation > max_lean: 
                        feedback.append({
                            'type': 'compensation',
                            'category': comp_name,
                            'severity': 'high',
                            'message': comp_config.get('feedback', 'Keep your trunk straight'),
                            'current_value': trunk_deviation * 100,
                            'threshold': comp_config.get('max_angle', 10)
                        })
                except (IndexError, KeyError):
                    pass  # Landmarks not visible
            
            elif comp_name == 'knee_bend':
                knee_angle = angles.get('knee_angle', 180)
                max_bend = comp_config. get('max_angle', 10)
                
                if knee_angle < (180 - max_bend):
                    feedback.append({
                        'type': 'compensation',
                        'category': comp_name,
                        'severity': 'medium',
                        'message': comp_config.get('feedback', 'Keep your knee straight'),
                        'current_value': knee_angle,
                        'threshold': 180 - max_bend
                    })
        
        return feedback
    
    
    def _update_rep_counter(
        self, 
        angles:  Dict[str, float], 
        timestamp: float
    ) -> Dict:
        """
        Update rep counting state machine
        
        State transitions:
        resting -> raising -> top -> lowering -> resting (rep complete!)
        
        Args:
            angles: Current joint angles
            timestamp: Current time
        
        Returns:
            Current state information
        """
        # Get primary angle for this exercise
        target_rom = self.exercise_rules['target_rom']
        acceptable_range = self.exercise_rules['acceptable_range']
        
        # Get the main angle we're tracking (first in joints_to_track)
        primary_joint = list(self.exercise_rules['joints_to_track'].keys())[0]
        angle_name = self.exercise_rules['joints_to_track'][primary_joint]['name']
        current_angle = angles.get(angle_name, 0)
        
        print(f"🎯 Tracking {angle_name}: {current_angle}° (state: {self.current_state}, reps: {self.rep_count})")
        
        # Determine movement direction
        if self.previous_angle is not None:
            angle_change = current_angle - self.previous_angle
        else:
            angle_change = 0
        
        self.previous_angle = current_angle
        
        # State machine logic
        if self.current_state == "resting":
            if current_angle > 30:  # Started movement
                print(f"🚀 State change: resting -> raising (angle: {current_angle}°)")
                self.current_state = "raising"
                self.state_start_time = timestamp
                self.current_rep_feedback = []
        
        elif self.current_state == "raising":
            if current_angle >= acceptable_range[0]:   # Reached target ROM
                print(f"⬆️ State change: raising -> top (angle: {current_angle}°, target: {acceptable_range[0]}°)")
                self.current_state = "top"
                self.state_start_time = timestamp
        
        elif self.current_state == "top":
            # Check hold duration
            hold_duration = timestamp - self.state_start_time
            required_hold = self.exercise_rules.get('hold_duration', {}).get('end_range', 2)
            
            # Start lowering (angle decreases)
            if angle_change < -2:  # Moving down
                print(f"⬇️ State change: top -> lowering (held for {hold_duration:.1f}s)")
                if hold_duration < required_hold:
                    self.current_rep_feedback.append({
                        'type': 'timing',
                        'message': f'Hold at the top for {required_hold} seconds',
                        'severity': 'low'
                    })
                self.current_state = "lowering"
        
        elif self.current_state == "lowering":
            if current_angle < 30:  # Returned to start position
                self.rep_count += 1
                print(f"✅ REP COMPLETED! Total: {self.rep_count}, Quality: {self.quality_reps}")
                
                # Check if rep had good form (no feedback)
                if len(self.current_rep_feedback) == 0:
                    self.quality_reps += 1
                
                self.current_state = "resting"
                self.state_start_time = timestamp
        
        return {
            'state': self.current_state,
            'rep_count': self.rep_count,
            'quality_reps': self.quality_reps
        }
    
    
    def _check_velocity(
        self, 
        angles: Dict[str, float], 
        timestamp: float
    ) -> List[Dict]:
        """
        Check if movement speed is within clinical recommendations
        
        Args:
            angles: Current joint angles
            timestamp: Current time
        
        Returns:
            Velocity feedback messages
        """
        feedback = []
        
        # Add current angle to history
        primary_joint = list(self.exercise_rules['joints_to_track'].keys())[0]
        angle_name = self.exercise_rules['joints_to_track'][primary_joint]['name']
        current_angle = angles.get(angle_name, 0)
        
        self.angle_history.append({
            'angle': current_angle,
            'timestamp': timestamp
        })
        
        # Keep only recent history
        if len(self. angle_history) > self.max_history_length:
            self.angle_history.pop(0)
        
        # Need at least 5 frames to calculate velocity
        if len(self.angle_history) < 5:
            return feedback
        
        # Calculate velocity (degrees per second)
        time_diff = self.angle_history[-1]['timestamp'] - self.angle_history[-5]['timestamp']
        angle_diff = self.angle_history[-1]['angle'] - self.angle_history[-5]['angle']
        
        if time_diff > 0:
            velocity = abs(angle_diff / time_diff)
            
            # Get velocity requirements
            velocity_config = self.exercise_rules.get('velocity', {})
            
            # Determine if concentric (raising) or eccentric (lowering)
            if angle_diff > 0:  # Raising
                phase = 'concentric'
            else:  # Lowering
                phase = 'eccentric'
            
            phase_config = velocity_config.get(phase, {})
            
            if isinstance(phase_config, tuple):
                min_vel, max_vel = phase_config
                
                if velocity < min_vel:
                    feedback.append({
                        'type': 'velocity',
                        'phase': phase,
                        'severity': 'low',
                        'message': velocity_config.get('feedback_too_slow', 'Move slightly faster'),
                        'current_value': round(velocity, 1),
                        'threshold': f'{min_vel}-{max_vel}°/s'
                    })
                
                elif velocity > max_vel:
                    feedback.append({
                        'type': 'velocity',
                        'phase': phase,
                        'severity': 'medium',
                        'message': velocity_config.get('feedback_too_fast', 'Slow down for control'),
                        'current_value': round(velocity, 1),
                        'threshold': f'{min_vel}-{max_vel}°/s'
                    })
        
        return feedback
    
    
    def _calculate_quality_score(
        self, 
        angles: Dict[str, float], 
        feedback: List[Dict]
    ) -> float:
        """
        Calculate quality score for current movement (0-100)
        
        Args:
            angles: Joint angles
            feedback: List of feedback messages
        
        Returns: 
            Quality score (100 = perfect form)
        """
        score = 100.0
        
        # Deduct points for each feedback item based on severity
        for item in feedback:
            severity = item.get('severity', 'low')
            
            if severity == 'high':
                score -= 20
            elif severity == 'medium':
                score -= 10
            elif severity == 'low': 
                score -= 5
        
        # Check ROM achievement
        primary_joint = list(self.exercise_rules['joints_to_track'].keys())[0]
        angle_name = self.exercise_rules['joints_to_track'][primary_joint]['name']
        current_angle = angles.get(angle_name, 0)
        
        target_rom = self.exercise_rules['target_rom']
        acceptable_range = self.exercise_rules['acceptable_range']
        
        # Deduct if not reaching target ROM
        if current_angle < acceptable_range[0]:
            rom_deficit = acceptable_range[0] - current_angle
            score -= min(rom_deficit / 2, 30)  # Max 30 points for ROM
        
        return max(0.0, min(100.0, score))
    
    
    def reset(self):
        """Reset analyzer state (for new session)"""
        self.rep_count = 0
        self. quality_reps = 0
        self.current_state = "resting"
        self.state_start_time = None
        self.angle_history = []
        self.current_rep_feedback = []
        self.previous_angle = None


def calculate_angle_simple(p1: Dict, p2: Dict, p3: Dict) -> float:
    """
    Standalone angle calculation function (for testing)
    
    Args:
        p1, p2, p3: Points with x, y, z coordinates
    
    Returns:
        Angle at p2 in degrees
    """
    analyzer = PoseAnalyzer('shoulder_flexion')  # Dummy instance
    return analyzer._calculate_angle_between_points(p1, p2, p3)