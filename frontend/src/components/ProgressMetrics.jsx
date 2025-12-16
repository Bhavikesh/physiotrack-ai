/**
 * ProgressMetrics Component
 * Displays rep count, quality score, and progress
 */

import { TrendingUp, Target, Award, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ProgressMetrics({ 
  repCount, 
  qualityReps, 
  qualityScore, 
  targetReps,
  currentState 
}) {
  const [prevRepCount, setPrevRepCount] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Trigger pulse animation on rep completion
  useEffect(() => {
    if (repCount > prevRepCount) {
      setShouldPulse(true);
      setTimeout(() => setShouldPulse(false), 300);
    }
    setPrevRepCount(repCount);
  }, [repCount]);

  const getQualityColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const progressPercentage = Math.min((repCount / targetReps) * 100, 100);
  const qualityPercentage = (qualityReps / Math.max(repCount, 1)) * 100;

  return (
    <div className="p-4 border-b border-gray-700">
      {/* Rep Counter */}
      <div className={`text-center mb-6 ${shouldPulse ? 'rep-counter-pulse' : ''}`}>
        <div className="text-6xl font-bold text-white mb-2">
          {repCount}
          <span className="text-3xl text-gray-400">/{targetReps}</span>
        </div>
        <p className="text-sm text-gray-400">Repetitions</p>
        
        {/* Progress Bar */}
        <div className="mt-4 bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-primary-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Quality Reps */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-400">Quality Reps</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {qualityReps}
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {qualityPercentage.toFixed(0)}% success rate
          </div>
          <div className="mt-1 text-xs text-green-400 font-medium">
            ✓ Perfect form, no errors
          </div>
        </div>

        {/* Form Quality */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-400">Form Quality</span>
          </div>
          <div className={`text-2xl font-bold ${getQualityColor(qualityScore)}`}>
            {Math.round(qualityScore)}%
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {getQualityLabel(qualityScore)}
          </div>
        </div>
      </div>

      {/* Current State Indicator */}
      <div className="mt-4 bg-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-gray-300">Current State: </span>
          </div>
          <span className="text-sm font-semibold text-white capitalize">
            {currentState?. replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Encouragement Message */}
      {repCount >= targetReps && (
        <div className="mt-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-3 text-center animate-pulse-slow">
          <p className="text-green-400 font-semibold">
            🎉 Goal Reached! Great job! 
          </p>
        </div>
      )}
    </div>
  );
}