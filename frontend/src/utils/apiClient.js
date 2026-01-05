import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers. Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
    return Promise. reject(error);
  }
);

// ============================================================================
// API METHODS
// ============================================================================

export const api = {
  // Authentication
  auth: {
    register: (userData) => apiClient.post('/api/v1/auth/register', userData),
    login: (credentials) => apiClient.post('/api/v1/auth/login', credentials),
    getMe: () => apiClient.get('/api/v1/auth/me'),
  },

  // Exercises
  exercises: {
    list: (params) => apiClient.get('/api/v1/exercises/', { params }),
    get: (exerciseId) => apiClient.get(`/api/v1/exercises/${exerciseId}`),
    getByCode: (exerciseCode) => apiClient.get(`/api/v1/exercises/code/${exerciseCode}`),
  },

  // Sessions
  sessions: {
    start: (sessionData) => apiClient.post('/api/v1/sessions/start', sessionData),
    analyzeFrame: (frameData) => apiClient.post('/api/v1/sessions/analyze-frame', frameData),
    end: (sessionId) => apiClient.post('/api/v1/sessions/end', { session_id: sessionId }),
    getHistory: (patientId, limit = 10) => 
      apiClient.get(`/api/v1/sessions/history/${patientId}`, { params: { limit } }),
    getByPatient: (patientId, limit = 5) =>
      apiClient.get(`/api/v1/sessions/history/${patientId}`, { params: { limit } }),
    getDetail: (sessionId) => apiClient.get(`/api/v1/sessions/${sessionId}`),
  },

  // Analytics
  analytics: {
    getPatient: (patientId) => apiClient.get(`/api/v1/analytics/patient/${patientId}`),
    getPTDashboard: (ptId) => apiClient.get(`/api/v1/analytics/pt-dashboard/${ptId}`),
    getROMHistory: (patientId, exerciseId, days = 30) => 
      apiClient.get(`/api/v1/analytics/rom-history/${patientId}/${exerciseId}`, { params: { days } }),
    getFeedbackSummary: (sessionId) => 
      apiClient.get(`/api/v1/analytics/feedback-summary/${sessionId}`),
  },

  // Personal Records
  records: {
    getRecords: (patientId) => apiClient.get(`/api/v1/records/patient/${patientId}/records`),
    updateSessionRecords: (sessionId) => apiClient.post(`/api/v1/records/session/${sessionId}/update-records`),
  },

  // Enhanced Analytics
  analyticsEnhanced: {
    getTrends: (patientId) => apiClient.get(`/api/v1/analytics-enhanced/patient/${patientId}/trends`),
    getAdherenceInsights: (patientId) => apiClient.get(`/api/v1/analytics-enhanced/patient/${patientId}/adherence-insights`),
  },
};

export default apiClient;