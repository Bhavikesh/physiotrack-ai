/**
 * Session Controls Component
 * Pause/Resume/Stop controls for exercise sessions
 */

import { Play, Pause, Square, RotateCcw } from 'lucide-react';

export default function SessionControls({ 
  isSessionActive,
  isPaused,
  onPause,
  onResume,
  onStop,
  onRestart,
  disabled = false
}) {
  
  return (
    <div className="flex items-center gap-3">
      {isSessionActive && !isPaused && (
        <button
          onClick={onPause}
          disabled={disabled}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          title="Pause session"
        >
          <Pause className="w-5 h-5" />
          Pause
        </button>
      )}

      {isSessionActive && isPaused && (
        <button
          onClick={onResume}
          disabled={disabled}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 animate-pulse"
          title="Resume session"
        >
          <Play className="w-5 h-5" />
          Resume
        </button>
      )}

      {isSessionActive && (
        <button
          onClick={onStop}
          disabled={disabled}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          title="Stop and end session"
        >
          <Square className="w-5 h-5" />
          Stop
        </button>
      )}

      {!isSessionActive && (
        <>
          <button
            onClick={onRestart}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            title="Start new session"
          >
            <Play className="w-5 h-5" />
            Start Session
          </button>
          
          <button
            onClick={onRestart}
            disabled={disabled}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
            Restart
          </button>
        </>
      )}

      {isPaused && (
        <div className="ml-3 flex items-center gap-2 text-yellow-400 animate-pulse">
          <Pause className="w-5 h-5" />
          <span className="text-sm font-medium">Session Paused</span>
        </div>
      )}
    </div>
  );
}
