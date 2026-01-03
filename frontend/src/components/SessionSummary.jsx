/**
 * Enhanced Session Summary Component
 * Displays detailed session results with insights and recommendations
 */

import { Trophy, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Zap, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SessionSummary({ 
  sessionData, 
  onClose, 
  onViewDetails,
  previousSessionData 
}) {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (sessionData) {
      generateInsights();
      generateRecommendations();
    }
  }, [sessionData]);

  const generateInsights = () => {
    const newInsights = [];

    // Compare with previous session
    if (previousSessionData) {
      const qualityDiff = sessionData.qualityPercentage - previousSessionData.qualityPercentage;
      if (qualityDiff > 0) {
        newInsights.push({
          type: 'positive',
          message: `Quality improved by ${qualityDiff.toFixed(1)}% since last session`,
          icon: <TrendingUp className="w-5 h-5 text-green-400" />
        });
      } else if (qualityDiff < -5) {
        newInsights.push({
          type: 'warning',
          message: `Quality decreased by ${Math.abs(qualityDiff).toFixed(1)}% - focus on form`,
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />
        });
      }

      const romDiff = sessionData.maxROM - (previousSessionData.maxROM || 0);
      if (romDiff > 3) {
        newInsights.push({
          type: 'positive',
          message: `Range of motion increased by ${romDiff.toFixed(1)}° 📈`,
          icon: <TrendingUp className="w-5 h-5 text-green-400" />
        });
      }
    }

    // Identify common issues
    if (sessionData.feedbackSummary) {
      const mostCommonIssue = Object.entries(sessionData.feedbackSummary)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (mostCommonIssue && mostCommonIssue[1] > 2) {
        newInsights.push({
          type: 'warning',
          message: `Most common issue: ${formatFeedbackType(mostCommonIssue[0])} (${mostCommonIssue[1]} times)`,
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />
        });
      }
    }

    // Highlight strengths
    if (sessionData.qualityPercentage >= 85) {
      newInsights.push({
        type: 'positive',
        message: 'Excellent form quality! Keep it up!',
        icon: <CheckCircle className="w-5 h-5 text-green-400" />
      });
    }

    if (sessionData.avgHoldDuration && sessionData.avgHoldDuration >= sessionData.targetHoldDuration) {
      newInsights.push({
        type: 'positive',
        message: 'Hold duration was perfect!',
        icon: <CheckCircle className="w-5 h-5 text-green-400" />
      });
    }

    setInsights(newInsights);
  };

  const generateRecommendations = () => {
    const newRecs = [];

    // Based on quality score
    if (sessionData.qualityPercentage < 70) {
      newRecs.push({
        title: 'Focus on Form',
        description: 'Slow down and concentrate on proper technique rather than rep count',
        priority: 'high'
      });
    }

    // Based on common issues
    if (sessionData.feedbackSummary?.trunk_compensation > 2) {
      newRecs.push({
        title: 'Reduce Trunk Movement',
        description: 'Keep your core engaged and minimize body sway during the movement',
        priority: 'high'
      });
    }

    if (sessionData.feedbackSummary?.elbow_bend > 2) {
      newRecs.push({
        title: 'Straighten Your Arm',
        description: 'Focus on keeping your elbow fully extended throughout the movement',
        priority: 'medium'
      });
    }

    if (sessionData.feedbackSummary?.velocity_too_fast > 2) {
      newRecs.push({
        title: 'Slow Down',
        description: 'Aim for 3 seconds per repetition for better muscle control',
        priority: 'medium'
      });
    }

    // Progress recommendations
    if (sessionData.qualityPercentage >= 90 && sessionData.maxROM >= sessionData.targetROM * 0.95) {
      newRecs.push({
        title: 'Ready to Progress',
        description: 'You\'re performing excellently! Consider increasing difficulty or ROM target',
        priority: 'low'
      });
    }

    // Next session planning
    newRecs.push({
      title: 'Next Session',
      description: `Schedule for tomorrow at ${getRecommendedTime()}. Goal: ${getNextGoal()}`,
      priority: 'low'
    });

    setRecommendations(newRecs);
  };

  const formatFeedbackType = (type) => {
    const mapping = {
      'trunk_compensation': 'Trunk leaning',
      'elbow_bend': 'Elbow bending',
      'velocity_too_fast': 'Moving too fast',
      'velocity_too_slow': 'Moving too slow',
      'incomplete_rom': 'Incomplete range',
      'hip_hike': 'Hip hiking'
    };
    return mapping[type] || type;
  };

  const getRecommendedTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '10:00 AM';
    if (hour < 17) return '3:00 PM';
    return '10:00 AM';
  };

  const getNextGoal = () => {
    if (sessionData.qualityPercentage < 85) {
      return `Reach ${Math.min(90, sessionData.qualityPercentage + 10).toFixed(0)}% quality score`;
    }
    if (sessionData.maxROM < sessionData.targetROM) {
      return `Increase ROM to ${Math.min(sessionData.targetROM, sessionData.maxROM + 10).toFixed(0)}°`;
    }
    return 'Maintain excellent form';
  };

  const getStreakMessage = () => {
    const streak = sessionData.currentStreak || 0;
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "1 day streak! 🔥";
    if (streak < 7) return `${streak} day streak! 🔥`;
    if (streak < 14) return `${streak} day streak! Keep going! 🔥🔥`;
    return `${streak} day streak! Incredible! 🔥🔥🔥`;
  };

  if (!sessionData) return null;

  const qualityColor = sessionData.qualityPercentage >= 85 ? 'green' : 
                       sessionData.qualityPercentage >= 70 ? 'yellow' : 'red';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl max-w-3xl w-full border border-gray-700 shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 rounded-t-xl border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-full">
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">🎉 Session Complete!</h2>
                <p className="text-green-200 text-sm mt-1">
                  {sessionData.exerciseName} • {sessionData.duration || '0:00'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Stats */}
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Session Stats
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Duration</div>
                <div className="text-white text-xl font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  {sessionData.duration || '0:00'}
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Total Reps</div>
                <div className="text-white text-xl font-bold">
                  {sessionData.totalReps || 0}
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Quality Reps</div>
                <div className={`text-${qualityColor}-400 text-xl font-bold flex items-center gap-2`}>
                  {sessionData.qualityReps || 0}
                  <span className="text-sm">
                    ({sessionData.qualityPercentage?.toFixed(0) || 0}%)
                  </span>
                  {sessionData.qualityPercentage >= 85 && '⭐'}
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Avg Quality Score</div>
                <div className={`text-${qualityColor}-400 text-xl font-bold`}>
                  {sessionData.avgQualityScore?.toFixed(0) || 0}%
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Max ROM Achieved</div>
                <div className="text-white text-xl font-bold">
                  {sessionData.maxROM?.toFixed(0) || 0}°
                  <span className="text-sm text-gray-400 ml-1">
                    / {sessionData.targetROM || 180}°
                  </span>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Current Streak</div>
                <div className="text-orange-400 text-xl font-bold">
                  {sessionData.currentStreak || 0} days 🔥
                </div>
              </div>
            </div>
          </div>

          {/* Today's Performance */}
          {previousSessionData && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-5 border border-blue-500/30">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Today's Performance
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Better than last session:</span>
                  <span className="text-green-400 font-semibold">
                    +{(sessionData.qualityPercentage - previousSessionData.qualityPercentage).toFixed(1)}% quality ↗️
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>ROM Improvement:</span>
                  <span className="text-green-400 font-semibold">
                    +{(sessionData.maxROM - previousSessionData.maxROM).toFixed(1)}° 📈
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Consistency:</span>
                  <span className="text-orange-400 font-semibold">
                    {getStreakMessage()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Insights & Analysis
              </h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      insight.type === 'positive' ? 'bg-green-900/20' : 'bg-yellow-900/20'
                    }`}
                  >
                    {insight.icon}
                    <p className={`text-sm ${
                      insight.type === 'positive' ? 'text-green-200' : 'text-yellow-200'
                    }`}>
                      {insight.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Recommendations & Next Steps
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === 'high' 
                        ? 'bg-red-900/20 border-red-500' 
                        : rec.priority === 'medium'
                        ? 'bg-yellow-900/20 border-yellow-500'
                        : 'bg-blue-900/20 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{rec.title}</h4>
                        <p className="text-gray-300 text-xs mt-1">{rec.description}</p>
                      </div>
                      {rec.priority === 'high' && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                          Priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onViewDetails}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              View Detailed Report
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
