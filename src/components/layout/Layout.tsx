import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  Typography,
  Breadcrumbs,
  Link,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  useMediaQuery,
  alpha,
  Badge,
  InputBase,
  Fade,
  ListItemIcon,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const DRAWER_WIDTH = 280;

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  backdropFilter: 'blur(8px)',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 8,
  backgroundColor: alpha(theme.palette.common.black, 0.04),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.06),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  transition: theme.transitions.create('all'),
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: alpha(theme.palette.text.primary, 0.5),
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
    fontSize: '0.875rem',
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    fontSize: 10,
    height: 16,
    minWidth: 16,
    padding: '0 4px',
  },
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.25rem',
  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'light' 
    ? alpha(theme.palette.background.default, 0.4)
    : theme.palette.background.default,
  minHeight: '100vh',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  paddingTop: '64px',
}));

// Aurora background with subtle animation
const AuroraBackground = () => {
  const theme = useTheme();
  
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      transition={{ duration: 1.5 }}
      sx={{
        position: 'fixed',
        height: '100vh',
        width: '100vw',
        top: 0,
        left: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 15% 50%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
            radial-gradient(circle at 85% 30%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 25%),
            radial-gradient(circle at 50% 80%, ${alpha(theme.palette.info.main, 0.08)} 0%, transparent 25%),
            radial-gradient(circle at 20% 10%, ${alpha(theme.palette.success.main, 0.08)} 0%, transparent 25%)
          `,
          opacity: 0.8,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(80px)',
        }
      }}
    />
  );
};

const Layout: React.FC = () => {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    signOut();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleProfileMenuClose();
  };

  // Generate breadcrumbs from current location
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const to = '/' + paths.slice(0, index + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1);
      
      return index === paths.length - 1 ? (
        <Typography key={to} color="text.primary" sx={{ fontSize: '0.875rem' }}>
          {label}
        </Typography>
      ) : (
        <Link key={to} color="inherit" href={to} sx={{ fontSize: '0.875rem' }}>
          {label}
        </Link>
      );
    });
  };

  // Notifications menu
  const notificationsMenu = (
    <Menu
      anchorEl={notificationsAnchor}
      open={Boolean(notificationsAnchor)}
      onClose={handleNotificationsClose}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
          mt: 1.5,
          width: 320,
          borderRadius: 2,
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
        <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
      </Box>
      {[
        { title: 'Your schedule has been updated', time: '5 minutes ago' },
        { title: 'New holiday request approved', time: '1 hour ago' },
        { title: 'Team meeting tomorrow at 10:00 AM', time: '3 hours ago' },
      ].map((notification, index) => (
        <MenuItem key={index} onClick={handleNotificationsClose} sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" fontWeight={500}>{notification.title}</Typography>
            <Typography variant="caption" color="text.secondary">{notification.time}</Typography>
          </Box>
        </MenuItem>
      ))}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
        <Typography 
          variant="body2" 
          color="primary" 
          sx={{ 
            cursor: 'pointer', 
            fontWeight: 500,
            '&:hover': { textDecoration: 'underline' } 
          }}
        >
          View all notifications
        </Typography>
      </Box>
    </Menu>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <AuroraBackground />
      <StyledAppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${open ? DRAWER_WIDTH : 0}px)` },
          ml: { sm: `${open ? DRAWER_WIDTH : 0}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                backgroundColor: open ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
                transition: theme.transitions.create('background-color'),
              }}
            >
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>

            {!open && (
              <Logo variant="h6" noWrap>
                CS CRM
              </Logo>
            )}

            <Breadcrumbs aria-label="breadcrumb" sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Link color="inherit" href="/" sx={{ fontSize: '0.875rem' }}>
                Home
              </Link>
              {generateBreadcrumbs()}
            </Breadcrumbs>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ 'aria-label': 'search' }}
              />
            </Search>

            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
                size="large"
                sx={{ 
                  backgroundColor: Boolean(notificationsAnchor) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  transition: theme.transitions.create('background-color'),
                }}
              >
                <StyledBadge badgeContent={3}>
                  <NotificationsIcon />
                </StyledBadge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton 
                color="inherit" 
                size="large"
                sx={{ 
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                  transition: theme.transitions.create('background-color'),
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Tooltip title="Profile">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ 
                  p: 0, 
                  ml: 1,
                  border: Boolean(anchorEl) ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                  transition: theme.transitions.create('border'),
                }}
              >
                <Avatar
                  alt={user?.name || 'User'}
                  sx={{ 
                    width: 38, 
                    height: 38,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </StyledAppBar>

      <Sidebar open={open} onClose={handleDrawerToggle} />

      <MainContent
        component="main"
        sx={{
          width: { sm: `calc(100% - ${open ? DRAWER_WIDTH : 0}px)` },
          marginLeft: { sm: `${open ? DRAWER_WIDTH : 0}px` },
        }}
      >
        <Fade in={true} timeout={800}>
          <Box>
            <Outlet />
          </Box>
        </Fade>
      </MainContent>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 220,
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Avatar
            alt={user?.name || 'User'}
            sx={{ 
              width: 60, 
              height: 60,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={600}>{user?.name || 'User'}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Profile</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2" color="error">Sign out</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      {notificationsMenu}
    </Box>
  );
};

export default Layout;
