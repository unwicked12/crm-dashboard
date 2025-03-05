// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  ListItemButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccessTime as ActivityIcon,
  BeachAccess as HolidayIcon,
  CalendarMonth as CalendarMonthIcon,
  LibraryBooks as LibraryBooksIcon,
  SupervisorAccount as HRIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Approval as ApprovalIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  EventBusy as EventBusyIcon,
  SupervisorAccount as SupervisorAccountIcon,
  ListAlt as ListAltIcon,
  Layers as LayersIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '../../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import logoImage from '../../logo.png';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  text: string;
  icon: JSX.Element;
  path: string;
  adminOnly?: boolean;
  hrOnly?: boolean;
  managerOnly?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Schedule', icon: <CalendarMonthIcon />, path: '/schedule' },
  { text: 'Knowledge Base', icon: <LibraryBooksIcon />, path: '/knowledge-base' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hrItems: NavItem[] = [
  { text: 'HR Dashboard', icon: <HRIcon />, path: '/hr', hrOnly: true },
];

// Manager items
const managerItems: NavItem[] = [
  { text: 'Manager Dashboard', icon: <SupervisorAccountIcon />, path: '/manager', managerOnly: true },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const adminItems: NavItem[] = [
  { text: 'Admin Dashboard', icon: <AdminIcon />, path: '/admin', adminOnly: true },
  { text: 'User Management', icon: <PersonIcon />, path: '/admin/users', adminOnly: true },
  { text: 'User Tiers', icon: <LayersIcon />, path: '/admin/tiers', adminOnly: true },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const location = useLocation();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';

  // Removed console.log // Debug log

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        {navItems.map((item) => (
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

        {(isHR || isAdmin) && (
          <>
            <Divider sx={{ my: 2 }} />
            {/* HR Section */}
            {hrItems.map((item) => (
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
                      variant: 'body2',
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            {adminItems.map((item) => (
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

            {/* Manager Section - Only visible to admin users */}
            {managerItems.map((item) => (
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
                      variant: 'body2',
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
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