/**
 * AngleIndicator Component
 * Shows real-time angle vs target for patient feedback
 */

import { Target, Activity } from 'lucide-react';

export default function AngleIndicator({ currentAngles, exerciseRules, currentState, weeksPostSurgery }) {
  if (!currentAngles || !exerciseRules) {
    return null;
  }

  // Get the primary angle being tracked
  const primaryJoint = Object.keys(exerciseRules.joints_to_track || {})[0];
  if (!primaryJoint) return null;

  const angleName = exerciseRules.joints_to_track[primaryJoint].name;
  const currentAngle = currentAngles[angleName] || 0;
  
  // Get target ranges
  const targetROM = exerciseRules.target_rom || 0;
  const acceptableRange = exerciseRules.acceptable_range || [0, targetROM];
  const startAngle = exerciseRules.start_angle || 0;
  
  // Calculate percentage of target reached
  const angleFromStart = Math.abs(currentAngle - startAngle);
  const percentageOfTarget = Math.min((angleFromStart / targetROM) * 100, 100);
  
  // Determine if in acceptable range
  const inRange = angleFromStart >= acceptableRange[0] && angleFromStart <= acceptableRange[1];
  
  // Color coding
  const getColor = () => {
    if (inRange) return 'text-green-500 border-green-500';
    if (angleFromStart > acceptableRange[1]) return 'text-yellow-500 border-yellow-500';
    return 'text-blue-500 border-blue-500';
  };

  const getBackgroundColor = () => {
    if (inRange) return 'bg-green-500';
    if (angleFromStart > acceptableRange[1]) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700">
      {/* Current Angle Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Current Position</span>
        </div>
        <div className={`text-2xl font-bold ${getColor()}`}>
          {Math.round(angleFromStart)}°
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-3">
        <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
          {/* Target Range Indicator */}
          <div 
            className="absolute h-full bg-green-900 bg-opacity-30"
            style={{
              left: `${(acceptableRange[0] / targetROM) * 100}%`,
              width: `${((acceptableRange[1] - acceptableRange[0]) / targetROM) * 100}%`
            }}
          />
          
          {/* Current Position Indicator */}
          <div 
            className={`absolute h-full ${getBackgroundColor()} transition-all duration-300 ease-out`}
            style={{ width: `${percentageOfTarget}%` }}
          />
          
          {/* Angle Text on Bar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {Math.round(angleFromStart)}° / {targetROM}°
            </span>
          </div>
        </div>
      </div>

      {/* Target Range Info */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400 mb-1">Target Range</div>
          <div className="text-white font-bold">
            {acceptableRange[0]}° - {acceptableRange[1]}°
          </div>
        </div>
        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400 mb-1">Movement State</div>
          <div className="text-white font-bold capitalize">
            {currentState?.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Post-Surgery Adjustment Notice */}
      {weeksPostSurgery !== null && weeksPostSurgery !== undefined && (
        <div className="mt-3 p-2 bg-blue-900 bg-opacity-30 border border-blue-500 rounded">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <div className="text-xs">
              <span className="text-blue-300 font-medium">
                {weeksPostSurgery} weeks post-surgery
              </span>
              <br />
              <span className="text-blue-400 text-xs">
                Targets adjusted for your recovery phase
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Guidance Text */}
      <div className="mt-3 text-xs text-center">
        {angleFromStart < acceptableRange[0] && (
          <span className="text-blue-400">
            💪 Keep going! Move {Math.round(acceptableRange[0] - angleFromStart)}° more
          </span>
        )}
        {inRange && (
          <span className="text-green-400">
            ✅ Perfect! You're in the target range
          </span>
        )}
        {angleFromStart > acceptableRange[1] && (
          <span className="text-yellow-400">
            ⚠️ Great effort! Return to center slowly
          </span>
        )}
      </div>
    </div>
  );
}
