import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Pages
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import PTDashboard from './pages/PTDashboard';
import ExercisePage from './pages/ExercisePage';
import HistoryPage from './pages/HistoryPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

// Context (simple state management)
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          
          {/* Patient routes */}
          <Route path="/dashboard" element={<PatientDashboard />} />
          <Route path="/exercise/: exerciseCode" element={<ExercisePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* PT routes */}
          <Route path="/pt-dashboard" element={<PTDashboard />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;