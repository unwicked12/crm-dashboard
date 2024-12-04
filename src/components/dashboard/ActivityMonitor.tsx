import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  PlayArrow as CheckInIcon,
  Stop as CheckOutIcon,
  Restaurant as LunchIcon,
  Coffee as BreakIcon,
  AccessTime as ClockIcon,
  PhoneInTalk as CallIcon,
  Computer as CRMIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface ActivityLog {
  type: string;
  timestamp: Date;
}

const ActivityMonitor: React.FC = () => {
  const theme = useTheme();
  const [activityStatus, setActivityStatus] = useState<string>('checked-out');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [totalBreakTime, setTotalBreakTime] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleActivityChange = (activity: string) => {
    const timestamp = new Date();
    
    if (breakStartTime && (activity === 'checked-in' || activity === 'checked-out')) {
      const breakDuration = Math.floor((timestamp.getTime() - breakStartTime.getTime()) / 1000 / 60);
      setTotalBreakTime(prev => prev + breakDuration);
      setBreakStartTime(null);
    }

    if (activity === 'break' || activity === 'lunch') {
      setBreakStartTime(timestamp);
    }

    setActivityStatus(activity);
    setActivityLogs(prev => [...prev, { type: activity, timestamp }]);

    const savedLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([...savedLogs, { type: activity, timestamp }]));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'checked-in':
        return theme.palette.success.main;
      case 'checked-out':
        return theme.palette.error.main;
      case 'lunch':
        return theme.palette.warning.main;
      case 'break':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case 'checked-in':
        return theme.palette.success.light;
      case 'checked-out':
        return theme.palette.error.light;
      case 'lunch':
        return theme.palette.warning.light;
      case 'break':
        return theme.palette.info.light;
      default:
        return theme.palette.action.hover;
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checked-in':
        return <CheckInIcon />;
      case 'checked-out':
        return <CheckOutIcon />;
      case 'lunch':
        return <LunchIcon />;
      case 'break':
        return <BreakIcon />;
      default:
        return <CallIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'checked-in':
        return 'success';
      case 'checked-out':
        return 'error';
      case 'lunch':
        return 'warning';
      case 'break':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(to right bottom, #ffffff, #f8fafc)',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: theme.palette.text.primary,
          fontWeight: 600,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ClockIcon sx={{ color: theme.palette.primary.main }} />
        Activity Monitor
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant={activityStatus === 'checked-in' ? 'contained' : 'outlined'}
          startIcon={<CheckInIcon />}
          onClick={() => handleActivityChange('checked-in')}
          color="success"
          sx={{
            minWidth: 120,
            transition: 'all 0.2s ease-in-out',
            transform: activityStatus === 'checked-in' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          Check In
        </Button>
        <Button
          variant={activityStatus === 'checked-out' ? 'contained' : 'outlined'}
          startIcon={<CheckOutIcon />}
          onClick={() => handleActivityChange('checked-out')}
          color="error"
          sx={{
            minWidth: 120,
            transition: 'all 0.2s ease-in-out',
            transform: activityStatus === 'checked-out' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          Check Out
        </Button>
        <Button
          variant={activityStatus === 'lunch' ? 'contained' : 'outlined'}
          startIcon={<LunchIcon />}
          onClick={() => handleActivityChange('lunch')}
          color="warning"
          sx={{
            minWidth: 120,
            transition: 'all 0.2s ease-in-out',
            transform: activityStatus === 'lunch' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          Lunch
        </Button>
        <Button
          variant={activityStatus === 'break' ? 'contained' : 'outlined'}
          startIcon={<BreakIcon />}
          onClick={() => handleActivityChange('break')}
          color="info"
          sx={{
            minWidth: 120,
            transition: 'all 0.2s ease-in-out',
            transform: activityStatus === 'break' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          Break
        </Button>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Current Status
        </Typography>
        <Chip
          label={activityStatus.replace('-', ' ').toUpperCase()}
          sx={{
            backgroundColor: getStatusBgColor(activityStatus),
            color: getStatusColor(activityStatus),
            fontWeight: 600,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: theme.shadows[2],
            },
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 0 }}>
          {activityLogs.slice(-5).reverse().map((log, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Divider variant="inset" component="li" />}
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getActivityColor(log.type)}.light` }}>
                    {getActivityIcon(log.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {log.type.toUpperCase()}
                      </Typography>
                      <Chip
                        label={format(new Date(log.timestamp), 'HH:mm:ss')}
                        size="small"
                        color={getActivityColor(log.type) as any}
                        variant="outlined"
                      />
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default ActivityMonitor;
