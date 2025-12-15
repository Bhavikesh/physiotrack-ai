/**
 * SkeletonOverlay Component
 * Draws pose skeleton on canvas with color-coded joints
 */

import { useEffect } from 'react';
import { POSE_LANDMARKS, POSE_CONNECTIONS, getVisibilityColor } from '../utils/poseUtils';

export default function SkeletonOverlay({ canvasRef, videoRef, landmarks, feedback }) {
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Match canvas size to video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');

    // Animation loop
    const drawSkeleton = () => {
      ctx.clearRect(0, 0, canvas.width, canvas. height);

      if (landmarks && landmarks.length === 33) {
        // Draw connections (bones)
        ctx.lineWidth = 3;
        POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];

          if (start?. visibility > 0.5 && end?. visibility > 0.5) {
            ctx.strokeStyle = getVisibilityColor(Math.min(start.visibility, end.visibility));
            ctx.beginPath();
            ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
            ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
            ctx.stroke();
          }
        });

        // Draw landmarks (joints)
        landmarks.forEach((landmark, index) => {
          if (landmark. visibility > 0.5) {
            const x = landmark.x * canvas.width;
            const y = landmark. y * canvas.height;

            // Check if this joint has feedback
            const hasFeedback = feedback?.some(f => 
              f.category?. includes(getLandmarkName(index).toLowerCase())
            );

            // Draw circle
            ctx.beginPath();
            ctx.arc(x, y, hasFeedback ? 8 : 5, 0, 2 * Math.PI);
            ctx.fillStyle = hasFeedback ? '#ef4444' : getVisibilityColor(landmark.visibility);
            ctx.fill();

            // Draw outline
            ctx.strokeStyle = hasFeedback ? '#fff' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx. stroke();

            // Draw pulsing effect for problematic joints
            if (hasFeedback) {
              const time = Date.now() / 1000;
              const pulseSize = 8 + Math.sin(time * 5) * 3;
              ctx.beginPath();
              ctx.arc(x, y, pulseSize, 0, 2 * Math.PI);
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          }
        });

        // Draw angle annotations
        if (feedback && feedback.length > 0) {
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;

          feedback.forEach(f => {
            if (f.current_value && f.category) {
              const joint = getJointForCategory(f.category, landmarks, canvas.width, canvas.height);
              if (joint) {
                const text = `${Math.round(f.current_value)}°`;
                ctx.strokeText(text, joint.x + 10, joint.y - 10);
                ctx.fillText(text, joint.x + 10, joint.y - 10);
              }
            }
          });
        }
      }

      requestAnimationFrame(drawSkeleton);
    };

    drawSkeleton();
  }, [landmarks, feedback]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]"
    />
  );
}

// Helper:  Get landmark name
function getLandmarkName(index) {
  const names = Object.keys(POSE_LANDMARKS);
  return names.find(name => POSE_LANDMARKS[name] === index) || '';
}

// Helper: Get joint position for feedback annotation
function getJointForCategory(category, landmarks, width, height) {
  const mapping = {
    'elbow_bend':  POSE_LANDMARKS.LEFT_ELBOW,
    'trunk_lean': POSE_LANDMARKS.LEFT_SHOULDER,
    'knee_bend': POSE_LANDMARKS.LEFT_KNEE,
  };

  const landmarkIdx = mapping[category];
  if (landmarkIdx !== undefined && landmarks[landmarkIdx]) {
    const lm = landmarks[landmarkIdx];
    return {
      x: lm.x * width,
      y: lm.y * height
    };
  }
  return null;
}