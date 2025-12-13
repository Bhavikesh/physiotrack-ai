"""
Clinical Exercise Rules
Based on APTA guidelines and physiotherapy best practices
"""

from typing import Dict, List, Tuple

# Clinical parameters for each exercise
EXERCISE_RULES:  Dict[str, Dict] = {
    "shoulder_flexion": {
        "name": "Shoulder Flexion",
        "description": "Raise arm forward and upward to full range",
        "target_rom": 180,  # degrees
        "acceptable_range": (160, 180),
        "joints_to_track": {
            "shoulder": {"points": [11, 13, 15], "name": "shoulder_angle"},  # MediaPipe landmark indices
            "elbow": {"points": [13, 15, 17], "name": "elbow_angle"},
        },
        "compensation_checks": {
            "trunk_lean": {
                "description": "Patient leaning backward to compensate",
                "max_angle": 10,
                "joints":  ["shoulder", "hip"],
                "feedback": "Keep your back straight.  You're leaning backward."
            },
            "elbow_bend": {
                "description": "Elbow should remain straight",
                "max_angle": 15,
                "joints": ["elbow"],
                "feedback": "Straighten your elbow. Keep your arm straight."
            }
        },
        "velocity":  {
            "concentric": (30, 60),  # degrees/second (raising phase)
            "eccentric": (20, 40),   # degrees/second (lowering phase)
            "feedback_too_fast": "Slow down! Move more controlled.",
            "feedback_too_slow": "Increase speed slightly for better muscle activation."
        },
        "hold_duration": {
            "end_range": 2,  # seconds to hold at top
            "rest_between": 3  # seconds between reps
        },
        "progression": {
            "week_1_2": {"reps": 10, "sets": 2, "resistance": "none"},
            "week_3_4": {"reps": 15, "sets": 3, "resistance": "light_band"},
            "week_5_6": {"reps": 20, "sets": 3, "resistance": "medium_band"}
        }
    },
    
    "knee_extension": {
        "name": "Knee Extension (Quad Set)",
        "description": "Straighten knee while seated, activate quadriceps",
        "target_rom": 0,  # full extension
        "acceptable_range":  (-5, 5),
        "joints_to_track": {
            "knee": {"points": [23, 25, 27], "name": "knee_angle"},
            "hip": {"points": [23, 11, 13], "name": "hip_angle"}
        },
        "compensation_checks": {
            "hip_hiking": {
                "description": "Lifting hip instead of using quad",
                "max_pelvic_tilt": 5,
                "joints": ["hip"],
                "feedback": "Keep your hips level. Use your thigh muscle, not your hip."
            }
        },
        "velocity":  {
            "concentric": (20, 40),
            "eccentric": (15, 30),
            "feedback_too_fast": "Slower!  Focus on muscle control.",
            "feedback_too_slow": "Good controlled movement!"
        },
        "hold_duration": {
            "end_range": 5,  # hold contraction longer for strength
            "rest_between": 5
        },
        "progression": {
            "week_1_2": {"reps": 10, "sets": 2, "resistance": "none"},
            "week_3_4": {"reps": 15, "sets": 3, "resistance": "ankle_weight_1lb"},
            "week_5_6": {"reps": 20, "sets": 3, "resistance": "ankle_weight_2lb"}
        }
    },
    
    "hip_abduction": {
        "name":  "Hip Abduction (Standing)",
        "description": "Lift leg out to the side while standing",
        "target_rom":  45,
        "acceptable_range": (35, 50),
        "joints_to_track": {
            "hip": {"points": [23, 25, 27], "name": "hip_abduction_angle"},
            "knee": {"points": [23, 25, 27], "name": "knee_angle"}
        },
        "compensation_checks": {
            "trunk_shift": {
                "description": "Leaning to side instead of lifting leg",
                "max_angle":  10,
                "joints":  ["trunk"],
                "feedback": "Keep your body upright. Don't lean to the side."
            },
            "knee_bend": {
                "description": "Knee should stay straight",
                "max_angle": 10,
                "joints": ["knee"],
                "feedback": "Keep your knee straight throughout the movement."
            }
        },
        "velocity": {
            "concentric": (25, 50),
            "eccentric":  (20, 40),
            "feedback_too_fast": "Slow down for better control.",
            "feedback_too_slow": "Good pace!"
        },
        "hold_duration": {
            "end_range": 2,
            "rest_between":  3
        },
        "progression": {
            "week_1_2": {"reps":  10, "sets": 2, "resistance": "none"},
            "week_3_4":  {"reps": 12, "sets": 3, "resistance": "light_band"},
            "week_5_6":  {"reps": 15, "sets": 3, "resistance":  "medium_band"}
        }
    },

    "squat": {
        "name":  "Squat",
        "description": "Lower body by bending knees and hips",
        "target_rom": 90,  # knee flexion angle
        "acceptable_range": (80, 100),
        "joints_to_track": {
            "knee": {"points": [23, 25, 27], "name": "knee_flexion"},
            "hip": {"points": [11, 23, 25], "name": "hip_flexion"},
            "ankle": {"points":  [25, 27, 31], "name": "ankle_dorsiflexion"}
        },
        "compensation_checks": {
            "knee_valgus": {
                "description": "Knees caving inward",
                "max_deviation": 10,
                "joints": ["knee"],
                "feedback": "Push your knees outward. Keep them aligned with your toes."
            },
            "forward_lean": {
                "description": "Excessive forward trunk lean",
                "max_angle": 45,
                "joints": ["trunk"],
                "feedback": "Keep your chest up. You're leaning too far forward."
            }
        },
        "velocity": {
            "concentric": (30, 60),
            "eccentric": (25, 50),
            "feedback_too_fast": "Control your descent.  Don't drop quickly.",
            "feedback_too_slow": "Good controlled movement!"
        },
        "hold_duration": {
            "end_range": 1,
            "rest_between":  3
        },
        "progression":  {
            "week_1_2": {"reps": 10, "sets": 2, "resistance": "bodyweight"},
            "week_3_4": {"reps": 12, "sets": 3, "resistance": "light_weight"},
            "week_5_6": {"reps": 15, "sets": 3, "resistance": "medium_weight"}
        }
    },

    "ankle_pump": {
        "name": "Ankle Pump (Dorsiflexion/Plantarflexion)",
        "description": "Point toes up and down while seated",
        "target_rom":  20,  # dorsiflexion
        "acceptable_range": (15, 25),
        "joints_to_track": {
            "ankle": {"points": [25, 27, 31], "name": "ankle_angle"}
        },
        "compensation_checks": {
            "knee_movement": {
                "description": "Knee should remain still",
                "max_angle":  5,
                "joints": ["knee"],
                "feedback": "Keep your knee still. Only move your ankle."
            }
        },
        "velocity": {
            "concentric": (40, 80),  # faster pumping motion
            "eccentric": (40, 80),
            "feedback_too_fast": "Good pace for circulation! ",
            "feedback_too_slow": "Speed up slightly for better blood flow."
        },
        "hold_duration": {
            "end_range": 1,
            "rest_between":  1  # minimal rest for pumping
        },
        "progression": {
            "week_1_2": {"reps":  20, "sets": 3, "resistance": "none"},
            "week_3_4":  {"reps": 30, "sets": 3, "resistance": "resistance_band"},
            "week_5_6": {"reps":  40, "sets": 3, "resistance": "resistance_band"}
        }
    }
}


def get_exercise_rules(exercise_id: str) -> Dict:
    """
    Get clinical rules for specific exercise
    
    Args:
        exercise_id: Exercise identifier (e.g., 'shoulder_flexion')
        
    Returns:
        Dictionary containing exercise rules
    """
    if exercise_id not in EXERCISE_RULES:
        raise ValueError(f"Exercise '{exercise_id}' not found in database")
    
    return EXERCISE_RULES[exercise_id]


def get_available_exercises() -> List[Dict]:
    """
    Get list of all available exercises
    
    Returns: 
        List of exercise summaries
    """
    return [
        {
            "id":  exercise_id,
            "name": rules["name"],
            "description":  rules["description"],
            "target_rom": rules["target_rom"]
        }
        for exercise_id, rules in EXERCISE_RULES.items()
    ]