/**
 * PatientDashboard Page
 * Main dashboard for patients
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import ExerciseSelector from '../components/ExerciseSelector';
import { 
  Activity, Calendar, TrendingUp, Award, 
  LogOut, Settings, Clock, Flame 
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentSessions, setRecentSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const patientId = user?.patient_id || 1; // Fallback for demo

  useEffect(() => {
    if (! user) {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [sessionsRes, analyticsRes] = await Promise.all([
        api.sessions.getHistory(patientId, 5),
        api.analytics.getPatient(patientId)
      ]);

      setRecentSessions(sessionsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate streak
  const calculateStreak = () => {
    if (!recentSessions || recentSessions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < recentSessions.length; i++) {
      const sessionDate = new Date(recentSessions[i].start_time);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 rounded-lg p-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PhysioTrack AI</h1>
                <p className="text-sm text-gray-500">Patient Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/history')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/progress')}
                className="text-gray-600 hover:text-gray-900"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}!  👋
          </h2>
          <p className="text-gray-600">
            {analytics?.injury_type && `Recovering from:  ${analytics.injury_type} • `}
            Week {analytics?.current_week || 1} of recovery
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Adherence</span>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {Math.round(analytics?.overall_adherence || 0)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Keep it up!</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Streak</span>
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {calculateStreak()}
            </div>
            <p className="text-xs text-gray-500 mt-1">days in a row</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Sessions</span>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {recentSessions. length}
            </div>
            <p className="text-xs text-gray-500 mt-1">this week</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Quality</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {recentSessions.length > 0 
                ? Math.round(recentSessions.reduce((sum, s) => sum + (s.average_quality_score || 0), 0) / recentSessions.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">form quality</p>
          </div>
        </div>

        {/* Exercises Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Today's Exercises</h3>
          <ExerciseSelector patientId={patientId} />
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          
          {recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map(session => (
                <div key={session.session_id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary-100 rounded-full p-3">
                      <Activity className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{session.exercise_name}</h4>
                      <p className="text-sm text-gray-600">
                        {session.total_reps} reps • {Math.round((session.quality_reps / session.total_reps) * 100)}% quality
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math. round(session.average_quality_score || 0)}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(session.start_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No sessions yet.  Start your first exercise above!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}