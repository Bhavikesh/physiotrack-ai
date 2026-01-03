/**
 * Landmark Optimization Utilities
 * Reduces payload size by sending only relevant landmarks per exercise
 */

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  // Head
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  
  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  
  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
};

/**
 * Relevant landmarks for each exercise type
 * Reduces data transmission by ~70%
 */
export const EXERCISE_LANDMARKS = {
  // Shoulder exercises
  'shoulder_flexion': [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP
  ],
  
  'shoulder_abduction': [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP
  ],
  
  'shoulder_rotation': [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP
  ],
  
  // Elbow exercises
  'elbow_flexion': [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST
  ],
  
  // Knee exercises
  'knee_extension': [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE,
    POSE_LANDMARKS.LEFT_FOOT_INDEX,
    POSE_LANDMARKS.RIGHT_FOOT_INDEX
  ],
  
  'knee_flexion': [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ],
  
  // Hip exercises
  'hip_abduction': [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ],
  
  'hip_flexion': [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ],
  
  // Ankle exercises
  'ankle_dorsiflexion': [
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE,
    POSE_LANDMARKS.LEFT_HEEL,
    POSE_LANDMARKS.RIGHT_HEEL,
    POSE_LANDMARKS.LEFT_FOOT_INDEX,
    POSE_LANDMARKS.RIGHT_FOOT_INDEX
  ],
  
  // Squat exercises
  'squat': [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE,
    POSE_LANDMARKS.LEFT_HEEL,
    POSE_LANDMARKS.RIGHT_HEEL
  ],
  
  // Neck exercises
  'neck_rotation': [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_EAR,
    POSE_LANDMARKS.RIGHT_EAR,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER
  ],
  
  'neck_flexion': [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_EAR,
    POSE_LANDMARKS.RIGHT_EAR,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER
  ]
};

/**
 * Get relevant landmarks for an exercise
 * @param {Array} allLandmarks - Full array of 33 landmarks from MediaPipe
 * @param {string} exerciseCode - Exercise identifier
 * @returns {Array} Filtered array of relevant landmarks only
 */
export function getRelevantLandmarks(allLandmarks, exerciseCode) {
  const relevantIndices = EXERCISE_LANDMARKS[exerciseCode];
  
  // If no specific mapping, return all landmarks
  if (!relevantIndices) {
    return allLandmarks;
  }
  
  // Filter to only relevant landmarks
  return relevantIndices.map(index => allLandmarks[index]);
}

/**
 * Compress landmark data for transmission
 * Reduces precision and removes unnecessary data
 * @param {Array} landmarks - Array of landmark objects
 * @returns {Array} Compressed landmark data
 */
export function compressLandmarks(landmarks) {
  return landmarks.map(landmark => ({
    x: Number(landmark.x.toFixed(4)), // 4 decimal places is enough
    y: Number(landmark.y.toFixed(4)),
    z: Number(landmark.z.toFixed(4)),
    visibility: Number(landmark.visibility.toFixed(3))
  }));
}

/**
 * Optimize landmarks for specific exercise
 * Combines filtering and compression
 * @param {Array} allLandmarks - Full landmarks array from MediaPipe
 * @param {string} exerciseCode - Exercise identifier
 * @returns {Object} Optimized data ready for transmission
 */
export function optimizeLandmarksForExercise(allLandmarks, exerciseCode) {
  const relevant = getRelevantLandmarks(allLandmarks, exerciseCode);
  const compressed = compressLandmarks(relevant);
  
  return {
    landmarks: compressed,
    exerciseCode: exerciseCode,
    count: compressed.length,
    timestamp: Date.now()
  };
}

/**
 * Calculate data reduction percentage
 * @param {number} originalSize - Original landmark count (typically 33)
 * @param {number} optimizedSize - Optimized landmark count
 * @returns {number} Reduction percentage
 */
export function calculateReduction(originalSize, optimizedSize) {
  return ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
}

/**
 * Adaptive frame analysis throttling
 * Adjusts analysis frequency based on backend response time
 */
export class AdaptiveThrottler {
  constructor(initialPeriod = 3) {
    this.analyzePeriod = initialPeriod; // Analyze every Nth frame
    this.lastAnalysisTime = 0;
    this.frameCount = 0;
  }

  shouldAnalyzeFrame() {
    this.frameCount++;
    return this.frameCount % this.analyzePeriod === 0;
  }

  updateBasedOnResponseTime(responseTime) {
    // If backend is slow (> 200ms), reduce frequency
    if (responseTime > 200) {
      this.analyzePeriod = Math.min(this.analyzePeriod + 1, 10); // Max every 10th frame
    } 
    // If backend is fast (< 100ms), can increase frequency
    else if (responseTime < 100 && this.analyzePeriod > 2) {
      this.analyzePeriod = Math.max(this.analyzePeriod - 1, 2); // Min every 2nd frame
    }
  }

  reset() {
    this.frameCount = 0;
  }

  getCurrentPeriod() {
    return this.analyzePeriod;
  }
}

export default {
  POSE_LANDMARKS,
  EXERCISE_LANDMARKS,
  getRelevantLandmarks,
  compressLandmarks,
  optimizeLandmarksForExercise,
  calculateReduction,
  AdaptiveThrottler
};
