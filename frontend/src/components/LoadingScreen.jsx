/**
 * Loading Screen Component
 * Displays loading state while MediaPipe initializes
 */

import { Loader2, Camera, Brain, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LoadingScreen({ 
  loadingStage = 'initializing',
  progress = 0,
  message = 'Loading AI pose detection...'
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const stages = {
    'initializing': {
      icon: <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />,
      title: 'Initializing Application',
      color: 'blue'
    },
    'loading_mediapipe': {
      icon: <Brain className="w-16 h-16 text-purple-400 animate-pulse" />,
      title: 'Loading AI Pose Detection',
      color: 'purple'
    },
    'requesting_camera': {
      icon: <Camera className="w-16 h-16 text-green-400 animate-pulse" />,
      title: 'Requesting Camera Access',
      color: 'green'
    },
    'connecting': {
      icon: <Wifi className="w-16 h-16 text-yellow-400 animate-pulse" />,
      title: 'Connecting to Server',
      color: 'yellow'
    }
  };

  const currentStage = stages[loadingStage] || stages.initializing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {currentStage.icon}
            <div className={`absolute inset-0 bg-${currentStage.color}-500 opacity-20 rounded-full blur-xl animate-pulse`}></div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {currentStage.title}
        </h2>

        {/* Message */}
        <p className="text-gray-400 text-center mb-8">
          {message}{dots}
        </p>

        {/* Progress Bar */}
        <div className="bg-gray-700 rounded-full h-2 overflow-hidden mb-4">
          <div
            className={`h-full bg-gradient-to-r from-${currentStage.color}-500 to-${currentStage.color}-600 transition-all duration-300 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <p className="text-center text-sm text-gray-400">
          {progress}% Complete
        </p>

        {/* Loading Steps */}
        <div className="mt-8 space-y-3">
          <LoadingStep 
            completed={progress > 25}
            active={loadingStage === 'initializing'}
            title="Initializing application"
          />
          <LoadingStep 
            completed={progress > 50}
            active={loadingStage === 'loading_mediapipe'}
            title="Loading pose detection AI"
          />
          <LoadingStep 
            completed={progress > 75}
            active={loadingStage === 'requesting_camera'}
            title="Setting up camera"
          />
          <LoadingStep 
            completed={progress >= 100}
            active={loadingStage === 'connecting'}
            title="Connecting to server"
          />
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            <strong>💡 Tip:</strong> Make sure you have good lighting and stand about 6 feet from your camera for best results.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ completed, active, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
        completed 
          ? 'bg-green-500' 
          : active 
          ? 'bg-blue-500 animate-pulse'
          : 'bg-gray-700'
      }`}>
        {completed ? (
          <span className="text-white text-xs">✓</span>
        ) : active ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : (
          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
        )}
      </div>
      <span className={`text-sm ${
        completed 
          ? 'text-green-400' 
          : active 
          ? 'text-white'
          : 'text-gray-500'
      }`}>
        {title}
      </span>
    </div>
  );
}
