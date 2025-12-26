/**
 * InstructionsModal Component
 * Modal dialog for displaying exercise instructions
 */

import { X, CheckCircle, AlertTriangle, Clock, BarChart3 } from 'lucide-react';

export default function InstructionsModal({ exerciseRules, isOpen, onClose }) {
  if (!isOpen || !exerciseRules) return null;

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

  const currentProgression = progression?.week_1_2 || { reps: 10, sets: 2, resistance: "none" };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-purple-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
            <p className="text-blue-200">How to perform this exercise correctly</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-blue-300 font-medium">Target ROM</span>
                </div>
                <p className="text-3xl font-bold text-blue-100">{target_rom}°</p>
              </div>
              
              {acceptable_range && (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
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
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Today's Goal
            </h3>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-400 block text-xs mb-1">Reps</span>
                <span className="text-white font-bold text-2xl">{currentProgression.reps}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs mb-1">Sets</span>
                <span className="text-white font-bold text-2xl">{currentProgression.sets}</span>
              </div>
              {currentProgression.resistance !== "none" && (
                <div>
                  <span className="text-gray-400 block text-xs mb-1">Resistance</span>
                  <span className="text-white font-semibold">{currentProgression.resistance.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Common Mistakes */}
          {compensation_checks && Object.keys(compensation_checks).length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Common Mistakes to Avoid
              </h3>
              <ul className="space-y-3">
                {Object.entries(compensation_checks).map(([key, check]) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1 text-xl">•</span>
                    <div>
                      <p className="text-yellow-100 font-medium">{check.description}</p>
                      <p className="text-yellow-200/80 text-sm mt-1">{check.feedback}</p>
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
                <Clock className="w-5 h-5 text-gray-400" />
                Timing Guidelines
              </h3>
              <div className="space-y-2 text-sm">
                {velocity && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lifting speed:</span>
                      <span className="text-white font-medium">{velocity.concentric[0]}-{velocity.concentric[1]}°/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lowering speed:</span>
                      <span className="text-white font-medium">{velocity.eccentric[0]}-{velocity.eccentric[1]}°/sec</span>
                    </div>
                  </>
                )}
                {hold_duration && (
                  <>
                    {hold_duration.end_range > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hold at top:</span>
                        <span className="text-white font-medium">{hold_duration.end_range} seconds</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rest between reps:</span>
                      <span className="text-white font-medium">{hold_duration.rest_between} seconds</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>✓ Position yourself so your full body is visible in the camera</li>
              <li>✓ Move slowly and with control - quality over speed</li>
              <li>✓ Breathe naturally throughout the movement</li>
              <li>✓ Stop if you feel sharp pain and consult your therapist</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-700 border-t border-gray-600 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Exercise
          </button>
        </div>
      </div>
    </div>
  );
}
