import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AIChatbox } from './components/AIChatbox';

import { DashboardPage } from './pages/DashboardPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { MeetingDetailPage } from './pages/MeetingDetailPage';
import { LiveMeetingPage } from './pages/LiveMeetingPage';
import { TasksPage } from './pages/TasksPage';
import { MLRiskInspectorPage } from './pages/MLRiskInspectorPage';
import { AutomationPage } from './pages/AutomationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" />} />

      {/* Authenticated Application Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Header />
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/meetings" element={<MeetingsPage />} />
                  <Route path="/meetings/:id" element={<MeetingDetailPage />} />
                  <Route path="/live" element={<LiveMeetingPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/risk-inspector" element={<MLRiskInspectorPage />} />
                  <Route path="/automation" element={<AutomationPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              {/* Universal Floating AI Chatbox */}
              <AIChatbox floating={true} />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
