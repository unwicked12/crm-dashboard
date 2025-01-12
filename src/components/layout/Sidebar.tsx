import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccessTime as ActivityIcon,
  BeachAccess as HolidayIcon,
  Group as AgentsIcon,
  Assessment as ReportIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Assessment as AssessmentIcon,
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../logo.png';

const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  text: string;
  icon: JSX.Element;
  path: string;
  adminOnly?: boolean;
  visibleTo?: (user: any) => boolean;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Activity', icon: <ActivityIcon />, path: '/activity' },
  { text: 'Schedule', icon: <HolidayIcon />, path: '/schedule' },
  { text: 'Knowledge Base', icon: <LibraryBooksIcon />, path: '/knowledge-base' },
  { 
    text: 'Admin Dashboard', 
    icon: <AdminIcon />, 
    path: '/admin',
    adminOnly: true,
    visibleTo: (user) => user.role === 'admin'
  }
];

const adminMenuItems: NavItem[] = [
  {
    text: 'Rapports',
    icon: <AssessmentIcon />,
    path: '/admin/reports'
  },
  {
    text: 'User Management',
    icon: <PersonIcon />,
    path: '/admin/users'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.visibleTo ? item.visibleTo(user) : user?.role === 'admin')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <img
          src={logoImage}
          alt="Logo"
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: 180,
          }}
        />
      </Box>

      {/* Navigation List */}
      <List sx={{ flex: 1, px: 2 }}>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        {user?.role === 'admin' && adminMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Info Section */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Logged in as
        </Typography>
        <Typography variant="body2" noWrap fontWeight="medium">
          {user?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block" gutterBottom>
          {user?.email}
        </Typography>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            mt: 1,
            borderRadius: 1,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.lighter',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.875rem',
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        position: 'fixed',
        height: '100%',
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          position: 'fixed',
          height: '100%',
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...(!open && {
            width: 0,
            overflowX: 'hidden',
          }),
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
