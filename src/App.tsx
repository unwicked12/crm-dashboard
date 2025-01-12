import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme/theme';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import ActivityMonitor from './components/dashboard/ActivityMonitor';
import AgentScheduleView from './components/dashboard/AgentScheduleView';
import KnowledgeBase from './components/knowledgeBase/KnowledgeBase';
import AdminDashboard from './components/admin/AdminDashboard';
import RequestManagement from './components/admin/RequestManagement';
import UserManagement from './components/admin/UserManagement';
import UserTierManagement from './components/admin/UserTierManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminRoute from './components/routes/AdminRoute';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="activity" element={<ActivityMonitor />} />
                <Route path="schedule" element={<AgentScheduleView />} />
                <Route path="knowledge-base" element={<KnowledgeBase />} />
                
                {/* Admin Routes */}
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/requests"
                  element={
                    <AdminRoute>
                      <RequestManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <AdminRoute>
                      <UserManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/tiers"
                  element={
                    <AdminRoute>
                      <UserTierManagement />
                    </AdminRoute>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
