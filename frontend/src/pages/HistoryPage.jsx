/**
 * HistoryPage Component
 * View past exercise sessions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { 
  ArrowLeft, Calendar, Activity, Clock, 
  TrendingUp, Award, Filter, Search 
} from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('all'); // 'all', 'completed', 'incomplete'

  const patientId = user?.patient_id || 1;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.sessions.getHistory(patientId, 50);
      setSessions(response. data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.exercise_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterCompleted === 'all' ?  true :
      filterCompleted === 'completed' ? session.completed : 
      ! session.completed;
    
    return matchesSearch && matchesFilter;
  });

  // Group by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = format(new Date(session.start_time), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {});

  const getQualityColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exercise History</h1>
                <p className="text-sm text-gray-500">{sessions.length} total sessions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {['all', 'completed', 'incomplete'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterCompleted(filter)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterCompleted === filter
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {Object.keys(groupedSessions).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedSessions)
              .sort((a, b) => new Date(b[0]) - new Date(a[0]))
              .map(([date, dateSessions]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </h2>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Sessions for this date */}
                  <div className="space-y-4">
                    {dateSessions.map(session => (
                      <div 
                        key={session.session_id}
                        className="card hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {/* View session details */}}
                      >
                        <div className="flex items-center justify-between">
                          {/* Left:  Exercise Info */}
                          <div className="flex items-center gap-4">
                            <div className="bg-primary-100 rounded-full p-3">
                              <Activity className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {session.exercise_name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {format(new Date(session.start_time), 'h:mm a')}
                                  </span>
                                </div>
                                {session.duration_seconds && (
                                  <span>
                                    {Math.floor(session.duration_seconds / 60)} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Stats */}
                          <div className="flex items-center gap-6">
                            {/* Reps */}
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-gray-600 mb-1">
                                <Award className="w-4 h-4" />
                                <span className="text-xs">Reps</span>
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {session.total_reps}
                              </div>
                              <div className="text-xs text-gray-500">
                                {session.quality_reps} quality
                              </div>
                            </div>

                            {/* Quality Score */}
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-gray-600 mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs">Quality</span>
                              </div>
                              <div className={`text-2xl font-bold ${getQualityColor(session.average_quality_score || 0).split(' ')[0]}`}>
                                {Math.round(session.average_quality_score || 0)}%
                              </div>
                              <div className={`text-xs px-2 py-0.5 rounded-full ${getQualityColor(session.average_quality_score || 0)}`}>
                                {session.average_quality_score >= 85 ? 'Excellent' : 
                                 session.average_quality_score >= 70 ?  'Good' :
                                 session.average_quality_score >= 60 ? 'Fair' : 'Poor'}
                              </div>
                            </div>

                            {/* Completed Status */}
                            {! session.completed && (
                              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                Incomplete
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCompleted !== 'all' 
                ? 'Try adjusting your filters'
                : 'Start exercising to see your history here'}
            </p>
            {(searchTerm || filterCompleted !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCompleted('all');
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
