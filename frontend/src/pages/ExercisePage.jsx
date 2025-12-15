/**
 * ExercisePage Component
 * Wrapper page for exercise session
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import ExerciseSession from '../components/ExerciseSession';
import { CheckCircle, TrendingUp, Award, Home } from 'lucide-react';

export default function ExercisePage() {
  const { exerciseCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

  const handleSessionComplete = (summary) => {
    setSessionSummary(summary);
    setSessionComplete(true);
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRestartExercise = () => {
    setSessionComplete(false);
    setSessionSummary(null);
    window.location.reload(); // Force fresh session
  };

  // Show completion screen
  if (sessionComplete && sessionSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Great Session!  🎉
            </h1>
            <p className="text-gray-600">
              You've completed your exercise session
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-primary-600" />
                <span className="text-sm text-primary-800 font-medium">Total Reps</span>
              </div>
              <div className="text-4xl font-bold text-primary-900">
                {sessionSummary. total_reps}
              </div>
              <p className="text-sm text-primary-700 mt-1">
                {sessionSummary.quality_reps} with good form
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <span className="text-sm text-green-800 font-medium">Quality Score</span>
              </div>
              <div className="text-4xl font-bold text-green-900">
                {Math.round(sessionSummary. average_quality_score)}%
              </div>
              <p className="text-sm text-green-700 mt-1">
                {sessionSummary.average_quality_score >= 85 ? 'Excellent!' : 
                 sessionSummary.average_quality_score >= 70 ? 'Good job!' : 'Keep practicing'}
              </p>
            </div>
          </div>

          {/* Duration & ROM */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(sessionSummary.duration_seconds / 60)}:{(sessionSummary.duration_seconds % 60).toString().padStart(2, '0')}
                </p>
              </div>
              {sessionSummary.rom_achieved && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Max ROM Achieved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(sessionSummary.rom_achieved)}°
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Summary */}
          {sessionSummary.feedback_summary && Object.keys(sessionSummary. feedback_summary).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-yellow-900 mb-3">Areas to Focus On:</h3>
              <ul className="space-y-2">
                {Object.entries(sessionSummary.feedback_summary).map(([category, count]) => (
                  <li key={category} className="text-sm text-yellow-800">
                    <span className="font-medium">{category. replace('_', ' ')}:</span> {count} corrections
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={handleReturnToDashboard}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Return to Dashboard
            </button>
            <button 
              onClick={handleRestartExercise}
              className="flex-1 btn-secondary"
            >
              Do Another Set
            </button>
          </div>

          {/* Encouragement */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {sessionSummary.average_quality_score >= 85 
                ? "Outstanding form! You're recovering well.  💪"
                : sessionSummary.average_quality_score >= 70
                ? "Good progress! Keep focusing on the feedback. 📈"
                : "Practice makes perfect! Review the feedback and try again. 🎯"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show exercise session
  return (
    <ExerciseSession
      exerciseCode={exerciseCode}
      patientId={user?.patient_id || 1}
      onComplete={handleSessionComplete}
    />
  );
}