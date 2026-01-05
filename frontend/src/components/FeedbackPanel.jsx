/**
 * FeedbackPanel Component
 * Displays real-time corrective feedback
 */

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function FeedbackPanel({ feedback, exerciseRules }) {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': 
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Real-Time Feedback
      </h3>

      {/* Real-Time Feedback Section */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-300 mb-2">
          💡 <strong>What you're doing wrong:</strong>
        </p>
        <p className="text-xs text-gray-400">
          The system analyzes your movement in real-time and provides instant feedback on form errors and compensations.
        </p>
      </div>

      {/* Feedback Messages */}
      <div className="space-y-3">
        {feedback && feedback.length > 0 ?  (
          <>
            <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-3 mb-3">
              <p className="text-sm font-bold text-red-200 mb-2">
                ⚠️ {feedback.length} Form Issue{feedback.length > 1 ? 's' : ''} Detected
              </p>
            </div>
            {feedback
              // Deduplicate feedback by message content
              .filter((item, index, arr) => 
                arr.findIndex(fb => fb.message === item.message) === index
              )
              .map((item, index) => (
              <div
                key={index}
                className={`feedback-alert p-4 rounded-lg border-2 ${getSeverityClass(item.severity)} animate-pulse-slow`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(item.severity)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-1">
                      {item.type?.toUpperCase() || 'CORRECTION'}:
                    </p>
                    <p className="font-medium text-base">
                      {item.message}
                    </p>
                    {item.current_value && item.threshold && (
                      <p className="text-xs mt-2 opacity-75 font-semibold">
                        📊 Current: {Math.round(item.current_value)}° • Target: {item.threshold}°
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-base font-bold text-green-800">
                  Perfect Form! 🎉
                </p>
                <p className="text-sm text-green-600 mt-1">
                  No corrections needed. Keep it up!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Instructions */}
      {exerciseRules && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">
            Exercise Tips
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            {exerciseRules.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Target ROM:</span>
              <span className="text-white font-medium">{exerciseRules.target_rom}°</span>
            </div>
            {exerciseRules.hold_duration && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Hold at top:</span>
                <span className="text-white font-medium">
                  {exerciseRules.hold_duration. end_range}s
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}