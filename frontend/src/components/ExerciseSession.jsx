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
import InstructionsModal from './InstructionsModal';
import VoiceSettings from './VoiceSettings';
import LoadingScreen from './LoadingScreen';
import SessionSummary from './SessionSummary';
import SessionControls from './SessionControls';
import { api } from '../utils/apiClient';
import VoiceFeedbackSystem from '../utils/VoiceFeedback';
import { Play, Pause, Square, AlertCircle, Info, Volume2 } from 'lucide-react';

export default function ExerciseSession({ exerciseCode, patientId, onComplete }) {
  // State management
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPoseDetectionReady, setIsPoseDetectionReady] = useState(false);
  const [loadingStage, setLoadingStage] = useState('initializing');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [showInstructions, setShowInstructions] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [previousSessionData, setPreviousSessionData] = useState(null);
  
  // Exercise data
  const [exerciseRules, setExerciseRules] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [repCount, setRepCount] = useState(0);
  const [qualityReps, setQualityReps] = useState(0);
  const [qualityScore, setQualityScore] = useState(100);
  const [feedback, setFeedback] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const frameNumberRef = useRef(0);
  const analysisInProgressRef = useRef(false);
  const voiceSystemRef = useRef(new VoiceFeedbackSystem());
  const lastRepAnnouncementRef = useRef(0);
  const lastRepCountRef = useRef(0);
  
  // Refs to hold current state values for callbacks
  const sessionIdRef = useRef(null);
  const isSessionActiveRef = useRef(false);

  // Initialize pose detection
  useEffect(() => {
    const initializePose = async () => {
      try {
        setLoadingStage('loading_mediapipe');
        setLoadingProgress(25);
        
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
        
        setLoadingProgress(50);
        setLoadingStage('requesting_camera');
        setIsPoseDetectionReady(true);
        setLoadingProgress(100);

        console.log('✅ MediaPipe Pose initialized');
      } catch (error) {
        console.error('❌ Failed to initialize pose detection:', error);
      }
    };

    initializePose();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up ExerciseSession...');
      
      // Stop voice system
      voiceSystemRef.current.stop();
      
      // Stop camera
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      
      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Close pose detection
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, []);

  // Debug: Track isSessionActive changes and sync refs
  useEffect(() => {
    console.log('🔄 isSessionActive changed to:', isSessionActive, 'sessionId:', sessionId);
    sessionIdRef.current = sessionId;
    isSessionActiveRef.current = isSessionActive;
    
    // Reset rep announcement tracking when session ends
    if (!isSessionActive) {
      lastRepAnnouncementRef.current = 0;
    }
  }, [isSessionActive, sessionId]);

  // Create new voice system for each session
  useEffect(() => {
    if (isSessionActive) {
      // Reset voice system at the start of session
      voiceSystemRef.current.stop();
    }
  }, [isSessionActive]);

  // Load exercise rules on mount
  useEffect(() => {
    const loadExerciseRules = async () => {
      try {
        console.log('📖 Loading exercise rules for:', exerciseCode);
        const response = await api.exercises.getByCode(exerciseCode);
        console.log('✅ Exercise rules loaded:', response.data);
        setExerciseRules(response.data.rules);
      } catch (error) {
        console.error('❌ Failed to load exercise rules:', error);
      }
    };

    if (exerciseCode) {
      loadExerciseRules();
    }
  }, [exerciseCode]);

  // Handle pose detection results
  const onPoseResults = async (results) => {
    // Store landmarks for skeleton overlay (always update for smooth rendering)
    if (results.poseLandmarks) {
      setCurrentAnalysis(prev => ({ ...prev, landmarks: results.poseLandmarks }));
    }
    
    // Debug logging
    if (frameNumberRef.current % 30 === 0) {  // Log every 30 frames
      console.log('📹 Pose results:', {
        hasLandmarks: !!results.poseLandmarks,
        landmarkCount: results.poseLandmarks?.length,
        isSessionActive: isSessionActiveRef.current,
        sessionId: sessionIdRef.current,
        analyzing: analysisInProgressRef.current
      });
    }
    
    // Only analyze when session is active (use refs to get current values!)
    if (!results.poseLandmarks || !isSessionActiveRef.current || analysisInProgressRef.current) {
      return;
    }

    frameNumberRef.current += 1;

    // Send to backend for analysis (throttle to every 3rd frame to reduce load)
    if (frameNumberRef.current % 3 === 0) {
      analysisInProgressRef.current = true;
      
      console.log(`🔄 Sending frame ${frameNumberRef.current} to backend (session: ${sessionIdRef.current})`);
      
      try {
        const response = await api.sessions.analyzeFrame({
          session_id: sessionIdRef.current,  // Use ref for current value
          landmarks: results.poseLandmarks,
          timestamp: Date.now() / 1000,
          frame_number: frameNumberRef.current
        });

        const analysis = response.data;
        // Merge with existing landmarks
        setCurrentAnalysis({ ...analysis, landmarks: results.poseLandmarks });
        setRepCount(analysis.rep_count);
        setQualityReps(analysis.quality_reps);
        setQualityScore(analysis.quality_score);
        setFeedback(analysis.feedback);

        // Voice feedback for form corrections (high priority)
        analysis.feedback.forEach(fb => {
          if (fb.severity === 'high') {
            voiceSystemRef.current.speak(fb.message, { 
              priority: 'high',
              feedbackId: fb.category
            });
          } else if (fb.severity === 'medium') {
            voiceSystemRef.current.speak(fb.message, { 
              priority: 'normal',
              feedbackId: fb.category
            });
          }
        });

        // Voice feedback for rep count - only announce when rep count actually increases
        if (analysis.rep_count > lastRepCountRef.current && isSessionActiveRef.current) {
          voiceSystemRef.current.speak(
            `Rep ${analysis.rep_count}`, 
            { 
              priority: 'normal',
              feedbackId: `rep_${analysis.rep_count}`,
              allowDuplicate: false
            }
          );
          lastRepCountRef.current = analysis.rep_count;
        }

        console.log('📊 Analysis received:', { 
          reps: analysis.rep_count, 
          quality: analysis.quality_score, 
          state: analysis.state,
          feedbackCount: analysis.feedback.length,
          feedback: analysis.feedback
        });

      } catch (error) {
        console.error('❌ Error analyzing frame:', error);
        console.error('Error details:', error.response?.data || error.message);
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
      console.log('🚀 Starting session for exercise:', exerciseCode);
      setLoadingStage('connecting');
      
      // Reset all state before starting new session
      setRepCount(0);
      setQualityReps(0);
      setQualityScore(100);
      setFeedback([]);
      setCurrentAnalysis(null);
      setIsPaused(false);
      frameNumberRef.current = 0;
      lastRepAnnouncementRef.current = 0;
      
      // Reset voice system for new session
      voiceSystemRef.current.stop();
      voiceSystemRef.current = new VoiceFeedbackSystem();
      
      // Load previous session data for comparison
      try {
        const previousSessionsResponse = await api.sessions.getByPatient(patientId);
        if (previousSessionsResponse.data && previousSessionsResponse.data.length > 0) {
          const lastSession = previousSessionsResponse.data[0];
          setPreviousSessionData({
            reps: lastSession.rep_count,
            qualityReps: lastSession.quality_reps,
            qualityScore: lastSession.quality_score,
            duration: lastSession.duration_seconds,
            date: lastSession.created_at
          });
          console.log('📊 Previous session data loaded');
        }
      } catch (err) {
        console.warn('⚠️ Could not load previous session:', err.message);
      }
      
      // Start session on backend (exercise rules already loaded)
      const exerciseResponse = await api.exercises.getByCode(exerciseCode);
      const sessionResponse = await api.sessions.start({
        patient_id: patientId,
        exercise_id: exerciseResponse.data.exercise_id
      });

      console.log('✅ Session started:', sessionResponse.data.session_id);
      setSessionId(sessionResponse.data.session_id);
      setSessionStartTime(new Date());
      setIsSessionActive(true);
      setLoadingStage(null);
      
      // Voice announcement for session start
      voiceSystemRef.current.speak(
        `Starting ${exerciseRules?.name || 'exercise'} session`, 
        { priority: 'high' }
      );

    } catch (error) {
      console.error('❌ Failed to start session:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to start exercise session. Please try again.');
    }
  };

  // End exercise session
  const endSession = async () => {
    if (!sessionId) {
      console.warn('⚠️ No session ID, cannot end session');
      return;
    }

    try {
      console.log('🛑 Ending session:', sessionId);
      
      // IMMEDIATELY stop voice and analysis to prevent further processing
      voiceSystemRef.current.stop();
      setIsSessionActive(false);
      isSessionActiveRef.current = false;
      setSessionEndTime(new Date());
      
      const response = await api.sessions.end(sessionId);
      const summary = response.data;

      // Calculate session metrics for SessionSummary
      const sessionDuration = summary.duration_seconds || 60;
      const sessionMetrics = {
        sessionId: sessionId,
        exerciseName: exerciseRules?.name || 'Exercise',
        duration: sessionDuration,
        totalReps: summary.rep_count,
        qualityReps: summary.quality_reps,
        qualityPercentage: summary.quality_reps > 0 
          ? Math.round((summary.quality_reps / summary.rep_count) * 100) 
          : 0,
        averageQuality: summary.quality_score,
        feedback: summary.feedback_summary || [],
        timestamp: new Date().toLocaleString()
      };

      // Update personal records via API
      try {
        await api.records.updateSessionRecords(sessionId);
        console.log('✅ Personal records updated');
      } catch (err) {
        console.warn('⚠️ Could not update personal records:', err.message);
      }

      // Voice announcement for session end
      setTimeout(() => {
        voiceSystemRef.current.speak(
          `Session complete. You completed ${summary.rep_count} reps with ${summary.quality_reps} quality reps`, 
          { priority: 'high' }
        );
      }, 500);

      // Stop camera
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      
      // Stop video stream tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log('🎥 Stopped track:', track.kind);
        });
        videoRef.current.srcObject = null;
      }

      console.log('✅ Session ended:', summary);
      
      // Show session summary modal with metrics
      setSessionSummaryData(sessionMetrics);
      setShowSessionSummary(true);
      
      // Reset all state
      setSessionId(null);
      setRepCount(0);
      setQualityReps(0);
      setQualityScore(100);
      setFeedback([]);
      setCurrentAnalysis(null);
      frameNumberRef.current = 0;
      lastRepAnnouncementRef.current = 0;
      analysisInProgressRef.current = false;
      
      // Call parent callback with summary
      if (onComplete) {
        onComplete(summary);
      }

    } catch (error) {
      console.error('❌ Failed to end session:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  // Pause exercise session
  const pauseSession = () => {
    if (!isSessionActive) return;
    
    setIsPaused(true);
    isSessionActiveRef.current = false;
    analysisInProgressRef.current = false;
    
    voiceSystemRef.current.speak('Session paused', { priority: 'high' });
    console.log('⏸️ Session paused');
  };

  // Resume exercise session
  const resumeSession = () => {
    if (!isSessionActive || !isPaused) return;
    
    setIsPaused(false);
    isSessionActiveRef.current = true;
    
    voiceSystemRef.current.speak('Resuming session', { priority: 'high' });
    console.log('▶️ Session resumed');
  };

  // Restart exercise session
  const restartSession = async () => {
    setShowSessionSummary(false);
    await startSession();
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
              <>
                <button 
                  onClick={() => setShowVoiceSettings(true)}
                  className="btn-secondary flex items-center gap-2"
                  title="Voice settings"
                >
                  <Volume2 className="w-5 h-5" />
                  Voice
                </button>
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Info className="w-5 h-5" />
                  How to Perform
                </button>
                <button 
                  onClick={startSession}
                  disabled={!isPoseDetectionReady || cameraPermission !== 'granted'}
                  className="btn-primary flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Exercise
                </button>
              </>
            ) : (
              <>
                <SessionControls 
                  isSessionActive={isSessionActive}
                  isPaused={isPaused}
                  onPause={pauseSession}
                  onResume={resumeSession}
                  onStop={endSession}
                  onRestart={restartSession}
                />
                <button 
                  onClick={endSession}
                  className="btn-danger flex items-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  End Session
                </button>
              </>
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

      {/* Instructions Modal */}
      <InstructionsModal
        exerciseRules={exerciseRules}
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      {/* Session Summary Modal */}
      {showSessionSummary && sessionSummaryData && (
        <SessionSummary
          sessionData={sessionSummaryData}
          previousSessionData={previousSessionData}
          onClose={() => {
            setShowSessionSummary(false);
            if (onComplete) {
              onComplete(sessionSummaryData);
            }
          }}
          onRestart={restartSession}
        />
      )}

      {/* Voice Settings Modal */}
      <VoiceSettings
        voiceSystem={voiceSystemRef.current}
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
      />
    </div>
  );
}