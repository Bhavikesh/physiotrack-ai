/**
 * InstructionsPanel Component
 * Displays exercise instructions, tips, and technique guidance
 */

import { Info, CheckCircle, AlertTriangle, Clock, BarChart3 } from 'lucide-react';

export default function InstructionsPanel({ exerciseRules, isSessionActive }) {
  if (!exerciseRules) {
    return (
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="text-center text-gray-400">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Loading exercise instructions...</p>
        </div>
      </div>
    );
  }

  const { 
    name, 
    description, 
    target_rom, 
    acceptable_range,
    compensation_checks,
    velocity,
    hold_duration,
    progression 
  } = exerciseRules;

  // Get current week progression (default to week_1_2)
  const currentProgression = progression?.week_1_2 || { reps: 10, sets: 2, resistance: "none" };

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700 transition-all duration-300 ${
      isSessionActive ? 'p-3' : 'p-6'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Info className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1">{name}</h2>
          <p className="text-sm text-gray-400">Follow these instructions carefully for optimal results</p>
        </div>
      </div>

      {/* Collapsible content when session is active */}
      {isSessionActive ? (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-200 text-sm">
            <strong>Quick Reminder:</strong> {description.split('.')[0]}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Instructions */}
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              How to Perform
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Target ROM */}
          {target_rom && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-300 font-medium">Target ROM</span>
                </div>
                <p className="text-2xl font-bold text-blue-100">{target_rom}°</p>
              </div>
              
              {acceptable_range && (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-300 font-medium">Good Range</span>
                  </div>
                  <p className="text-lg font-bold text-green-100">
                    {acceptable_range[0]}° - {acceptable_range[1]}°
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Today's Goal */}
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Today's Goal
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-400">Reps:</span>
                <span className="ml-2 text-white font-bold text-lg">{currentProgression.reps}</span>
              </div>
              <div>
                <span className="text-gray-400">Sets:</span>
                <span className="ml-2 text-white font-bold text-lg">{currentProgression.sets}</span>
              </div>
              {currentProgression.resistance !== "none" && (
                <div>
                  <span className="text-gray-400">Resistance:</span>
                  <span className="ml-2 text-white font-semibold">
                    {currentProgression.resistance.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Common Mistakes to Avoid */}
          {compensation_checks && Object.keys(compensation_checks).length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Common Mistakes to Avoid
              </h3>
              <ul className="space-y-2">
                {Object.entries(compensation_checks).map(([key, check]) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <div>
                      <p className="text-yellow-100 font-medium">{check.description}</p>
                      <p className="text-yellow-200/80 text-xs mt-0.5">{check.feedback}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timing Guidelines */}
          {(velocity || hold_duration) && (
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Timing Guidelines
              </h3>
              <div className="space-y-2 text-sm">
                {velocity && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lifting speed:</span>
                      <span className="text-white">{velocity.concentric[0]}-{velocity.concentric[1]}°/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lowering speed:</span>
                      <span className="text-white">{velocity.eccentric[0]}-{velocity.eccentric[1]}°/sec</span>
                    </div>
                  </>
                )}
                {hold_duration && (
                  <>
                    {hold_duration.end_range > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hold at top:</span>
                        <span className="text-white">{hold_duration.end_range} seconds</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rest between reps:</span>
                      <span className="text-white">{hold_duration.rest_between} seconds</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              💡 Pro Tips
            </h3>
            <ul className="space-y-1.5 text-sm text-blue-100">
              <li>• Position yourself so your full body is visible in the camera</li>
              <li>• Move slowly and with control - quality over speed</li>
              <li>• Breathe naturally throughout the movement</li>
              <li>• Stop if you feel sharp pain and consult your therapist</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
