/**
 * ProgressPage Component
 * View progress analytics and charts
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { 
  ArrowLeft, TrendingUp, TrendingDown, 
  Activity, Award, AlertTriangle 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';

export default function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const patientId = user?.patient_id || 1;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api. analytics.getPatient(patientId);
      setAnalytics(response.data);
      if (response.data.exercises. length > 0) {
        setSelectedExercise(response. data.exercises[0]);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
              <p className="text-sm text-gray-500">
                Week {analytics.current_week} • {analytics.injury_type || 'Recovery'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Adherence</span>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {Math.round(analytics.overall_adherence)}%
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-full rounded-full transition-all"
                style={{ width: `${analytics.overall_adherence}%` }}
              />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Exercises</span>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {analytics.exercises. length}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              exercises in program
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Red Flags</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {analytics.red_flags. length}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {analytics.red_flags.length === 0 ? 'All good!' : 'needs attention'}
            </p>
          </div>
        </div>

        {/* Red Flags */}
        {analytics.red_flags.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Attention Required
            </h3>
            <ul className="space-y-2">
              {analytics.red_flags.map((flag, idx) => (
                <li key={idx} className="text-sm text-red-800">
                  • {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exercise Selector */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Exercise to View Details</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {analytics. exercises.map(exercise => (
              <button
                key={exercise.exercise_code}
                onClick={() => setSelectedExercise(exercise)}
                className={`px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedExercise?.exercise_code === exercise.exercise_code
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                }`}
              >
                {exercise.exercise_name}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Details */}
        {selectedExercise && (
          <div className="space-y-6">
            {/* Exercise Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Current Week</p>
                <p className="text-3xl font-bold text-gray-900">{selectedExercise. current_week}</p>
              </div>

              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Adherence Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(selectedExercise.adherence_rate)}%
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Quality Trend</p>
                <div className="flex items-center gap-2">
                  <p className={`text-3xl font-bold ${
                    selectedExercise.quality_score_trend > 0 ? 'text-green-600' : 
                    selectedExercise.quality_score_trend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {selectedExercise.quality_score_trend > 0 ?  '+' : ''}
                    {selectedExercise.quality_score_trend. toFixed(1)}%
                  </p>
                  {selectedExercise.quality_score_trend > 0 ?  (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : selectedExercise.quality_score_trend < 0 ? (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  ) : null}
                </div>
              </div>

              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Last Session</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedExercise.last_session 
                    ? new Date(selectedExercise.last_session).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* ROM Progress Chart */}
            {selectedExercise.rom_trends. length > 0 && (
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Range of Motion Progress
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedExercise.rom_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="week" 
                      label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Degrees (°)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="average_rom" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Average ROM"
                      dot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="max_rom" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      name="Max ROM"
                      dot={{ r: 5 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sessions Count Chart */}
            {selectedExercise.rom_trends.length > 0 && (
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Weekly Session Count
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={selectedExercise.rom_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions_count" fill="#3b82f6" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}