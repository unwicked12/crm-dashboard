import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme/theme';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import ActivityMonitor from './components/dashboard/ActivityMonitor';
import AgentScheduleView from './components/dashboard/AgentScheduleView';
import HolidayRequest from './components/dashboard/HolidayRequest';
import SaturdayAvailability from './components/dashboard/SaturdayAvailability';
import KnowledgeBase from './components/knowledgeBase/KnowledgeBase';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import UserTierManagement from './components/admin/UserTierManagement';
import HRDashboard from './components/hr/HRDashboard';
import ManagerDashboard from './components/manager/ManagerDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminRoute from './components/routes/AdminRoute';
import ManagerRoute from './components/routes/ManagerRoute';
import PrivateRoute from './components/routes/PrivateRoute';
import HRRoute from './components/routes/HRRoute';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                <Route path="holiday" element={<HolidayRequest />} />
                <Route path="saturday-availability" element={<SaturdayAvailability />} />
                <Route path="knowledge-base" element={<KnowledgeBase />} />
                <Route path="knowledge-base/article/:id" element={<KnowledgeBase />} />
                
                {/* HR Routes */}
                <Route
                  path="hr"
                  element={
                    <HRRoute>
                      <HRDashboard />
                    </HRRoute>
                  }
                />
                
                {/* Manager Routes */}
                <Route
                  path="manager"
                  element={
                    <ManagerRoute>
                      <ManagerDashboard />
                    </ManagerRoute>
                  }
                />
                
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
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
