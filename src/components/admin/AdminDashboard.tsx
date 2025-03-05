import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Description as RequestIcon,
  Group as AgentsIcon,
  BeachAccess as HolidayIcon,
  AccessTime as SpecialRequestIcon,
  Refresh as RefreshIcon,
  Article as ArticleIcon,
  Person as UserIcon,
  Layers as TiersIcon,
} from '@mui/icons-material';
import RequestManagement from './RequestManagement';
import TeamCalendar from './TeamCalendar';
import ActivityOverview from './ActivityOverview';
import ArticleApprovalList from '../ArticleApprovalList';
import UserManagement from './UserManagement';
import UserTierManagement from './UserTierManagement';
import { dashboardService, DashboardStats } from '../../services/dashboardService';
import { useNavigate, useLocation } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 2,
      },
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}15`,
        color: color,
        mb: 2,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h4" sx={{ mb: 1, fontWeight: 'medium' }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {title}
    </Typography>
  </Paper>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    activeAgents: 0,
    plannedHolidays: 0,
    specialRequests: 0,
  });
  
  // Determine the active tab based on the URL or default to 'requests'
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/tiers')) return 'tiers';
    return 'requests';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);
  const [pendingArticles, setPendingArticles] = useState(0);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time stats updates
    const unsubscribe = dashboardService.subscribeToStats((newStats) => {
      setStats(newStats);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      navigate('/admin/users', { replace: true });
    } else if (activeTab === 'tiers') {
      navigate('/admin/tiers', { replace: true });
    } else if (activeTab !== 'requests' && location.pathname !== '/admin') {
      navigate('/admin', { replace: true });
    }
  }, [activeTab, navigate, location.pathname]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const freshStats = await dashboardService.getStats();
      setStats(freshStats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
            Admin Dashboard
          </Typography>
          <Tooltip title="Refresh Stats">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests}
              icon={<RequestIcon />}
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Agents"
              value={stats.activeAgents}
              icon={<AgentsIcon />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Planned Holidays"
              value={stats.plannedHolidays}
              icon={<HolidayIcon />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Special Requests"
              value={stats.specialRequests}
              icon={<SpecialRequestIcon />}
              color="#f44336"
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Request Management" value="requests" />
          <Tab label="Team Calendar" value="calendar" />
          <Tab label="Activity Overview" value="activity" />
          <Tab label="Article Approvals" value="articles" />
          <Tab label="User Management" value="users" icon={<UserIcon />} iconPosition="start" />
          <Tab label="User Tiers" value="tiers" icon={<TiersIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {activeTab === 'requests' && <RequestManagement />}
        {activeTab === 'calendar' && <TeamCalendar />}
        {activeTab === 'activity' && <ActivityOverview />}
        {activeTab === 'articles' && <ArticleApprovalList />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'tiers' && <UserTierManagement />}
      </Box>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default AdminDashboard;
