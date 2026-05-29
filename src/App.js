import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LiveCamera from './components/LiveCamera';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { ArtifactProvider } from './context/ArtifactContext';

function App() {
  return (
    <ArtifactProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LiveCamera />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ArtifactProvider>
  );
}

export default App;
