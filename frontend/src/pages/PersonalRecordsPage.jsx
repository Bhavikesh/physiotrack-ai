import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Zap, Target, Calendar, ChevronRight } from 'lucide-react';
import api from '../utils/api';

export default function PersonalRecordsPage() {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientId] = useState(localStorage.getItem('patient_id') || '1');

  useEffect(() => {
    fetchPersonalRecords();
  }, []);

  const fetchPersonalRecords = async () => {
    try {
      setLoading(true);
      const response = await api.records.getRecords(patientId);
      setRecords(response.data);
      console.log('📋 Personal records loaded:', response.data);
    } catch (err) {
      console.error('❌ Failed to load records:', err);
      setError('Failed to load personal records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-300">{error}</p>
          <button 
            onClick={fetchPersonalRecords}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Group records by exercise
  const recordsByExercise = {};
  if (records && Array.isArray(records)) {
    records.forEach(record => {
      const exercise = record.exercise_name || 'Unknown Exercise';
      if (!recordsByExercise[exercise]) {
        recordsByExercise[exercise] = [];
      }
      recordsByExercise[exercise].push(record);
    });
  }

  const recordsList = Object.entries(recordsByExercise).map(([exercise, exerciseRecords]) => {
    const bestRecord = exerciseRecords[0];
    return { exercise, ...bestRecord };
  });

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-white">Personal Records</h1>
          </div>
          <p className="text-gray-400">Your achievements and milestones across all exercises</p>
        </div>

        {/* Stats Overview */}
        {recordsList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Exercises</p>
                  <p className="text-3xl font-bold text-white">{recordsList.length}</p>
                </div>
                <Target className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Avg. Quality Score</p>
                  <p className="text-3xl font-bold text-white">
                    {records && records.length > 0
                      ? (records.reduce((sum, r) => sum + (r.best_quality_score || 0), 0) / records.length).toFixed(0)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Best ROM</p>
                  <p className="text-3xl font-bold text-white">
                    {records && records.length > 0
                      ? Math.max(...records.map(r => r.best_rom || 0))
                      : 0}°
                  </p>
                </div>
                <Zap className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Longest Streak</p>
                  <p className="text-3xl font-bold text-white">
                    {records && records.length > 0
                      ? Math.max(...records.map(r => r.longest_streak || 0))
                      : 0} days
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Records by Exercise */}
        <div className="space-y-6">
          {recordsList.length > 0 ? (
            recordsList.map((record, idx) => (
              <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start mb-6">
                  {/* Exercise Info */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{record.exercise}</h3>
                    {record.created_at && (
                      <p className="text-sm text-gray-400">
                        Achieved: {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Best Quality Score */}
                  <div className="bg-gradient-to-br from-green-900 to-gray-900 rounded p-4 border border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <p className="text-xs text-green-400 font-semibold">BEST QUALITY</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{record.best_quality_score || 0}%</p>
                  </div>

                  {/* Most Reps */}
                  <div className="bg-gradient-to-br from-blue-900 to-gray-900 rounded p-4 border border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <p className="text-xs text-blue-400 font-semibold">MOST REPS</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{record.most_reps || 0}</p>
                  </div>

                  {/* Best ROM */}
                  <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded p-4 border border-purple-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <p className="text-xs text-purple-400 font-semibold">BEST ROM</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{record.best_rom || 0}°</p>
                  </div>

                  {/* Longest Streak */}
                  <div className="bg-gradient-to-br from-orange-900 to-gray-900 rounded p-4 border border-orange-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <p className="text-xs text-orange-400 font-semibold">STREAK</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{record.longest_streak || 0} days</p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <a 
                    href={`/exercise/${record.exercise}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    View Exercise
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">No Records Yet</h3>
              <p className="text-gray-400 mb-6">
                Complete exercises to start building your personal records!
              </p>
              <a 
                href="/exercises"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Start an Exercise
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
