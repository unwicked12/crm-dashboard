import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  Book as KnowledgeBaseIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as ReportsIcon,
  People as UserManagementIcon,
  WorkspacePremium as TierIcon,
  ExitToApp as LogoutIcon,
  AccessTime as ActivityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    title: 'Activity',
    path: '/activity',
    icon: <ActivityIcon />,
  },
  {
    title: 'Schedule',
    path: '/schedule',
    icon: <ScheduleIcon />,
  },
  {
    title: 'Knowledge Base',
    path: '/knowledge-base',
    icon: <KnowledgeBaseIcon />,
  },
];

const adminItems: NavigationItem[] = [
  {
    title: 'Admin Dashboard',
    path: '/admin',
    icon: <AdminIcon />,
    adminOnly: true,
  },
  {
    title: 'Rapports',
    path: '/admin/reports',
    icon: <ReportsIcon />,
    adminOnly: true,
  },
  {
    title: 'User Management',
    path: '/admin/users',
    icon: <UserManagementIcon />,
    adminOnly: true,
  },
  {
    title: 'User Tiers',
    path: '/admin/tiers',
    icon: <TierIcon />,
    adminOnly: true,
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
  };

  const renderNavItem = (item: NavigationItem) => {
    if (item.adminOnly && !isAdmin) return null;

    return (
      <ListItem
        button
        component={Link}
        to={item.path}
        selected={location.pathname === item.path}
        key={item.path}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText primary={item.title} />
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <img src="/logo.png" alt="CashSentinel" style={{ width: '100%', height: 'auto', marginBottom: '1rem' }} />
      </Box>
      <Divider />
      <Box sx={{ overflow: 'auto', p: 2 }}>
        <List>
          {navigationItems.map(renderNavItem)}
          {isAdmin && (
            <>
              <Divider sx={{ my: 2 }} />
              {adminItems.map(renderNavItem)}
            </>
          )}
        </List>
      </Box>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Logged in as
          </Typography>
          <Typography variant="subtitle2">
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 