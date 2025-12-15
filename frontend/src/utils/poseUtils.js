/**
 * Pose Utility Functions
 * Helper functions for pose detection and angle calculations
 */

/**
 * Calculate angle between three points
 * @param {Object} a - Point A {x, y, z}
 * @param {Object} b - Point B (vertex) {x, y, z}
 * @param {Object} c - Point C {x, y, z}
 * @returns {number} Angle in degrees
 */
export function calculateAngle(a, b, c) {
  // Create vectors
  const vectorBA = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: (a.z || 0) - (b.z || 0)
  };
  
  const vectorBC = {
    x:  c.x - b.x,
    y: c.y - b.y,
    z: (c.z || 0) - (b.z || 0)
  };
  
  // Calculate magnitudes
  const magnitudeBA = Math.sqrt(
    vectorBA.x ** 2 + vectorBA.y ** 2 + vectorBA. z ** 2
  );
  
  const magnitudeBC = Math.sqrt(
    vectorBC. x ** 2 + vectorBC.y ** 2 + vectorBC.z ** 2
  );
  
  if (magnitudeBA === 0 || magnitudeBC === 0) return 0;
  
  // Calculate dot product
  const dotProduct = 
    vectorBA.x * vectorBC.x +
    vectorBA.y * vectorBC.y +
    vectorBA.z * vectorBC.z;
  
  // Calculate angle
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
  const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const angleDegrees = (angleRadians * 180) / Math.PI;
  
  return angleDegrees;
}

/**
 * MediaPipe landmark indices
 */
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE:  2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT:  9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY:  18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE:  26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL:  30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX:  32,
};

/**
 * Connections between landmarks for skeleton drawing
 */
export const POSE_CONNECTIONS = [
  // Face
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS. LEFT_EYE],
  [POSE_LANDMARKS.RIGHT_EAR, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.MOUTH_LEFT, POSE_LANDMARKS. MOUTH_RIGHT],
  
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS. RIGHT_HIP],
  
  // Left arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_PINKY],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS. LEFT_INDEX],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_THUMB],
  
  // Right arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS. RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_PINKY],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_THUMB],
  
  // Left leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS. LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS. LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  
  // Right leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS. RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS. RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

/**
 * Check if landmark is visible enough
 */
export function isLandmarkVisible(landmark, threshold = 0.5) {
  return landmark && landmark.visibility >= threshold;
}

/**
 * Get visibility color for skeleton drawing
 */
export function getVisibilityColor(visibility) {
  if (visibility >= 0.8) return '#22c55e'; // Green - excellent
  if (visibility >= 0.6) return '#3b82f6'; // Blue - good
  if (visibility >= 0.4) return '#f59e0b'; // Orange - fair
  return '#ef4444'; // Red - poor
}

/**
 * Convert normalized coordinates to canvas coordinates
 */
export function landmarkToCanvas(landmark, canvasWidth, canvasHeight) {
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight,
    z: landmark.z,
    visibility: landmark.visibility
  };
}

/**
 * Calculate distance between two landmarks
 */
export function calculateDistance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    ((a.z || 0) - (b.z || 0)) ** 2
  );
}

/**
 * Check if user is too close or too far from camera
 */
export function checkCameraDistance(landmarks) {
  if (! landmarks || landmarks.length < 33) return { status: 'unknown' };
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS. RIGHT_SHOULDER];
  
  if (! leftShoulder || !rightShoulder) return { status: 'unknown' };
  
  const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
  
  if (shoulderWidth > 0.4) {
    return { status: 'too_close', message: 'Step back from the camera' };
  } else if (shoulderWidth < 0.15) {
    return { status:  'too_far', message:  'Move closer to the camera' };
  }
  
  return { status: 'good' };
}

/**
 * Check if user is centered in frame
 */
export function checkFramingAlignment(landmarks) {
  if (!landmarks || landmarks.length < 33) return { status: 'unknown' };
  
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  if (!nose) return { status: 'unknown' };
  
  const centerX = 0.5;
  const tolerance = 0.15;
  
  if (Math.abs(nose.x - centerX) > tolerance) {
    if (nose.x < centerX) {
      return { status: 'off_center', message: 'Move to your right' };
    } else {
      return { status: 'off_center', message: 'Move to your left' };
    }
  }
  
  return { status: 'centered' };
}

/**
 * Smooth landmark positions over time (reduce jitter)
 */
export class LandmarkSmoother {
  constructor(smoothingFactor = 0.5) {
    this.smoothingFactor = smoothingFactor;
    this.previousLandmarks = null;
  }
  
  smooth(landmarks) {
    if (!this.previousLandmarks) {
      this.previousLandmarks = landmarks;
      return landmarks;
    }
    
    const smoothed = landmarks.map((landmark, index) => {
      const prev = this.previousLandmarks[index];
      return {
        x: landmark.x * this.smoothingFactor + prev.x * (1 - this.smoothingFactor),
        y: landmark.y * this. smoothingFactor + prev.y * (1 - this.smoothingFactor),
        z: landmark.z * this.smoothingFactor + (prev.z || 0) * (1 - this.smoothingFactor),
        visibility: landmark.visibility
      };
    });
    
    this.previousLandmarks = smoothed;
    return smoothed;
  }
  
  reset() {
    this.previousLandmarks = null;
  }
}