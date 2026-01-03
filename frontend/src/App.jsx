import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import PTDashboard from './pages/PTDashboard';
import ExercisePage from './pages/ExercisePage';
import HistoryPage from './pages/HistoryPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

// Context (simple state management)
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      
      {/* Protected Patient routes */}
      <Route path="/dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
      <Route path="/exercise/:exerciseCode" element={<ProtectedRoute><ExercisePage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      
      {/* Protected PT routes */}
      <Route path="/pt-dashboard" element={<ProtectedRoute><PTDashboard /></ProtectedRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;