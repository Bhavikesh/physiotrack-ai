import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, Activity, Target, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../utils/api';

export default function ProgressAnalyticsPage() {
  const [trends, setTrends] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientId] = useState(localStorage.getItem('patient_id') || '1');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [trendsRes, adherenceRes] = await Promise.all([
        api.analyticsEnhanced.getTrends(patientId),
        api.analyticsEnhanced.getAdherenceInsights(patientId)
      ]);
      
      setTrends(trendsRes.data);
      setAdherence(adherenceRes.data);
      console.log('📊 Analytics loaded');
    } catch (err) {
      console.error('❌ Failed to load analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your analytics...</p>
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
            onClick={fetchAnalytics}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const romTrendData = trends?.rom_trends || [];
  const qualityTrendData = trends?.quality_trends || [];
  const repsTrendData = trends?.reps_trends || [];
  const adherenceData = adherence?.adherence_matrix || [];

  // Calculate metrics
  const avgQuality = trends?.trends?.avg_quality_score || 0;
  const avgROM = trends?.trends?.avg_rom || 0;
  const totalSessions = trends?.trends?.total_sessions || 0;
  const consistency = adherence?.consistency_score || 0;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Progress Analytics</h1>
          </div>
          <p className="text-gray-400">Track your improvement trends and performance insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Average Quality Score</p>
              <Activity className="w-5 h-5 text-green-500 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-white">{avgQuality.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 mt-2">vs. previous period</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Average ROM</p>
              <Target className="w-5 h-5 text-purple-500 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-white">{avgROM.toFixed(0)}°</p>
            <p className="text-xs text-gray-500 mt-2">Range of motion</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Total Sessions</p>
              <Calendar className="w-5 h-5 text-blue-500 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-white">{totalSessions}</p>
            <p className="text-xs text-gray-500 mt-2">completed</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Consistency Score</p>
              {consistency >= 70 ? (
                <ArrowUp className="w-5 h-5 text-green-500 opacity-60" />
              ) : (
                <ArrowDown className="w-5 h-5 text-orange-500 opacity-60" />
              )}
            </div>
            <p className="text-3xl font-bold text-white">{consistency.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 mt-2">adherence rate</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quality Score Trend */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Quality Score Trend
            </h3>
            {qualityTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="quality_score" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                    name="Quality %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 h-72 flex items-center justify-center">
                Insufficient data for trend analysis
              </p>
            )}
          </div>

          {/* ROM Trend */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Range of Motion (ROM) Trend
            </h3>
            {romTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={romTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avg_rom" 
                    stroke="#A855F7" 
                    strokeWidth={2}
                    dot={{ fill: '#A855F7' }}
                    name="ROM (°)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 h-72 flex items-center justify-center">
                Insufficient data for trend analysis
              </p>
            )}
          </div>

          {/* Reps Trend */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Reps Per Session Trend
            </h3>
            {repsTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={repsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="rep_count" 
                    fill="#F97316" 
                    name="Reps"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 h-72 flex items-center justify-center">
                Insufficient data for trend analysis
              </p>
            )}
          </div>

          {/* Session Frequency */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Weekly Session Frequency
            </h3>
            {adherenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={adherenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="sessions" fill="#3B82F6" name="Sessions" radius={[8, 8, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 h-72 flex items-center justify-center">
                Insufficient data for frequency analysis
              </p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {trends?.trends?.recommendations && trends.trends.recommendations.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Personalized Recommendations</h3>
            <ul className="space-y-3">
              {trends.trends.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{idx + 1}</span>
                  </div>
                  <span className="text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
