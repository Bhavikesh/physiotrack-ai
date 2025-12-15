/**
 * PTDashboard Component
 * Dashboard for physiotherapists to monitor patients
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { 
  Users, AlertTriangle, TrendingUp, Activity,
  Search, Filter, Eye, LogOut, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function PTDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('red_flags'); // 'red_flags', 'adherence', 'name'

  const ptId = user?.user_id || 1;

  useEffect(() => {
    if (! user || user.user_type !== 'physiotherapist') {
      navigate('/');
      return;
    }

    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    try {
      const response = await api.analytics.getPTDashboard(ptId);
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort patients
  const filteredPatients = patients
    .filter(patient => 
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.injury_type?. toLowerCase().includes(searchTerm. toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'red_flags':
          return b.red_flags_count - a.red_flags_count;
        case 'adherence':
          return a.adherence_rate - b. adherence_rate;
        case 'name':
          return a.full_name.localeCompare(b.full_name);
        default:
          return 0;
      }
    });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getAdherenceLabel = (rate) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    return 'Needs Attention';
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
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 rounded-lg p-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PhysioTrack AI</h1>
                <p className="text-sm text-gray-500">Physiotherapist Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Dr. {user?. first_name} {user?.last_name}
              </span>
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
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Patients</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">{patients.length}</div>
            <p className="text-xs text-gray-500 mt-1">under your care</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Today</span>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {patients.filter(p => {
                if (! p.last_session) return false;
                const today = new Date();
                const sessionDate = new Date(p.last_session);
                return sessionDate.toDateString() === today.toDateString();
              }).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">completed sessions</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Needs Attention</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {patients.filter(p => p.red_flags_count > 0).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">patients with alerts</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Adherence</span>
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {patients.length > 0
                ? Math.round(patients.reduce((sum, p) => sum + p.adherence_rate, 0) / patients.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">across all patients</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or injury..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="red_flags">Sort by:  Red Flags</option>
                <option value="adherence">Sort by: Adherence</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients List */}
        {filteredPatients.length > 0 ? (
          <div className="space-y-4">
            {filteredPatients.map(patient => (
              <div 
                key={patient.patient_id}
                className="card hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  {/* Left:  Patient Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl">
                      {patient.full_name. split(' ').map(n => n[0]).join('')}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.full_name}
                        </h3>
                        {patient.red_flags_count > 0 && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {patient.red_flags_count} Alert{patient.red_flags_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">
                          {patient.injury_type || 'General Recovery'}
                        </span>
                        <span>•</span>
                        <span>Week {patient.current_week}</span>
                        {patient.last_session && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Last session: {format(new Date(patient.last_session), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stats & Actions */}
                  <div className="flex items-center gap-6">
                    {/* Adherence */}
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Adherence</p>
                      <div className={`text-2xl font-bold ${
                        patient.adherence_rate >= 80 ? 'text-green-600' :
                        patient. adherence_rate >= 60 ? 'text-yellow-600' :  'text-red-600'
                      }`}>
                        {Math.round(patient.adherence_rate)}%
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getAdherenceColor(patient.adherence_rate)}`}>
                        {getAdherenceLabel(patient.adherence_rate)}
                      </span>
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => navigate(`/patient/${patient.patient_id}`)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Inactive Warning */}
                {patient.last_session && 
                 (new Date() - new Date(patient.last_session)) / (1000 * 60 * 60 * 24) > 3 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No activity for {Math.floor((new Date() - new Date(patient.last_session)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'You have no patients assigned yet'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}