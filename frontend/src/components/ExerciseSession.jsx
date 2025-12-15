/**
 * ExerciseSession Component
 * Main component for real-time exercise tracking with pose detection
 */

import { useState, useEffect, useRef } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import SkeletonOverlay from './SkeletonOverlay';
import FeedbackPanel from './FeedbackPanel';
import ProgressMetrics from './ProgressMetrics';
import CameraSetup from './CameraSetup';
import { api } from '../utils/apiClient';
import { Play, Pause, Square, AlertCircle } from 'lucide-react';

export default function ExerciseSession({ exerciseCode, patientId, onComplete }) {
  // State management
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPoseDetectionReady, setIsPoseDetectionReady] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  
  // Exercise data
  const [exerciseRules, setExerciseRules] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [repCount, setRepCount] = useState(0);
  const [qualityReps, setQualityReps] = useState(0);
  const [qualityScore, setQualityScore] = useState(100);
  const [feedback, setFeedback] = useState([]);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const frameNumberRef = useRef(0);
  const analysisInProgressRef = useRef(false);

  // Initialize pose detection
  useEffect(() => {
    const initializePose = async () => {
      try {
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence:  0.5
        });

        pose.onResults(onPoseResults);
        poseRef.current = pose;
        setIsPoseDetectionReady(true);

        console.log('✅ MediaPipe Pose initialized');
      } catch (error) {
        console.error('❌ Failed to initialize pose detection:', error);
      }
    };

    initializePose();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  // Handle pose detection results
  const onPoseResults = async (results) => {
    if (!results. poseLandmarks || ! isSessionActive || analysisInProgressRef.current) {
      return;
    }

    frameNumberRef.current += 1;

    // Draw skeleton on canvas
    if (canvasRef.current && videoRef.current) {
      const canvasCtx = canvasRef.current. getContext('2d');
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // We'll draw the skeleton in SkeletonOverlay component
      canvasCtx.restore();
    }

    // Send to backend for analysis (throttle to every 3rd frame to reduce load)
    if (frameNumberRef.current % 3 === 0) {
      analysisInProgressRef.current = true;
      
      try {
        const response = await api.sessions.analyzeFrame({
          session_id: sessionId,
          landmarks: results.poseLandmarks,
          timestamp: Date.now() / 1000,
          frame_number: frameNumberRef.current
        });

        const analysis = response.data;
        setCurrentAnalysis(analysis);
        setRepCount(analysis.rep_count);
        setQualityReps(analysis.quality_reps);
        setQualityScore(analysis.quality_score);
        setFeedback(analysis.feedback);

      } catch (error) {
        console.error('Error analyzing frame:', error);
      } finally {
        analysisInProgressRef.current = false;
      }
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraPermission('granted');

        // Start MediaPipe camera
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });

        camera.start();
        cameraRef.current = camera;

        console.log('✅ Camera started');
      }
    } catch (error) {
      console.error('❌ Camera access denied:', error);
      setCameraPermission('denied');
    }
  };

  // Start exercise session
  const startSession = async () => {
    try {
      // Fetch exercise rules
      const exerciseResponse = await api.exercises. getByCode(exerciseCode);
      setExerciseRules(exerciseResponse.data.rules);

      // Start session on backend
      const sessionResponse = await api.sessions.start({
        patient_id: patientId,
        exercise_id: exerciseResponse.data.exercise_id
      });

      setSessionId(sessionResponse.data.session_id);
      setIsSessionActive(true);
      frameNumberRef.current = 0;

      console.log('✅ Session started:', sessionResponse.data.session_id);
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      alert('Failed to start exercise session. Please try again.');
    }
  };

  // End exercise session
  const endSession = async () => {
    if (!sessionId) return;

    try {
      const response = await api.sessions.end(sessionId);
      const summary = response.data;

      setIsSessionActive(false);
      
      // Stop camera
      if (cameraRef.current) {
        cameraRef.current.stop();
      }

      // Call parent callback with summary
      if (onComplete) {
        onComplete(summary);
      }

      console.log('✅ Session ended:', summary);
    } catch (error) {
      console.error('❌ Failed to end session:', error);
    }
  };

  // Initialize camera on mount
  useEffect(() => {
    if (isPoseDetectionReady) {
      startCamera();
    }
  }, [isPoseDetectionReady]);

  // Render camera permission screen
  if (cameraPermission === 'denied') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Camera Access Denied</h2>
          <p className="text-gray-400 mb-6">
            Please enable camera access in your browser settings to use PhysioTrack AI. 
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {exerciseRules?. name || 'Exercise Session'}
            </h1>
            <p className="text-sm text-gray-400">
              {isSessionActive ? 'Session in progress.. .' : 'Ready to start'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {! isSessionActive ?  (
              <button 
                onClick={startSession}
                disabled={!isPoseDetectionReady || cameraPermission !== 'granted'}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Exercise
              </button>
            ) : (
              <button 
                onClick={endSession}
                className="btn-danger flex items-center gap-2"
              >
                <Square className="w-5 h-5" />
                End Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Feed + Skeleton */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />
          
          <SkeletonOverlay
            canvasRef={canvasRef}
            videoRef={videoRef}
            landmarks={currentAnalysis?.landmarks}
            feedback={feedback}
          />

          {/* Camera Setup Guide */}
          {! isSessionActive && (
            <CameraSetup 
              isVisible={cameraPermission === 'granted'} 
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {/* Progress Metrics */}
          <ProgressMetrics
            repCount={repCount}
            qualityReps={qualityReps}
            qualityScore={qualityScore}
            targetReps={exerciseRules?.progression?.week_1_2?.reps || 10}
            currentState={currentAnalysis?.state || 'resting'}
          />

          {/* Feedback Panel */}
          <FeedbackPanel
            feedback={feedback}
            exerciseRules={exerciseRules}
          />
        </div>
      </div>
    </div>
  );
}