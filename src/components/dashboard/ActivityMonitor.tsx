import React, { useState, useEffect, useCallback } from 'react';
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
  Card,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PlayArrow as CheckInIcon,
  Stop as CheckOutIcon,
  Restaurant as LunchIcon,
  Coffee as BreakIcon,
  AccessTime as ClockIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { format, differenceInMinutes, isToday, startOfDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { activityService, UserStatus } from '../../services/activityService';
import { 
  doc, 
  onSnapshot, 
  query, 
  collection, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import type { 
  DocumentSnapshot, 
  QuerySnapshot
} from '@firebase/firestore-types';
import { db } from '../../firebase';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface ActivityLog {
  id: string;
  type: UserStatus;
  timestamp: Date;
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

interface ActivityDocument {
  status: UserStatus;
  lastAction: string;
  lastActionTime: FirestoreTimestamp;
  userName: string;
  email: string;
  currentTask?: string;
}

const ActivityMonitor: React.FC = () => {
  const theme = useTheme();
  const { firebaseUser } = useAuth();
  const [activityStatus, setActivityStatus] = useState<UserStatus>('checked-out');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [totalBreakTime, setTotalBreakTime] = useState<number>(0);
  const [workingTime, setWorkingTime] = useState<number>(0);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [currentBreakDuration, setCurrentBreakDuration] = useState<number>(0);
  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const calculateWorkingAndBreakTime = useCallback((logs: ActivityLog[]) => {
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    let lastCheckin: Date | null = null;
    let lastBreakStart: Date | null = null;

    // Sort logs chronologically for calculation
    const chronologicalLogs = [...logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    chronologicalLogs.forEach((log) => {
      if (log.type === 'checked-in') {
        lastCheckin = log.timestamp;
        if (lastBreakStart) {
          const breakDuration = differenceInMinutes(log.timestamp, lastBreakStart);
          if (!isNaN(breakDuration) && breakDuration > 0) {
            totalBreakMinutes += breakDuration;
          }
          lastBreakStart = null;
        }
      } else if (log.type === 'checked-out' && lastCheckin) {
        const duration = differenceInMinutes(log.timestamp, lastCheckin);
        if (!isNaN(duration) && duration > 0) {
          totalWorkMinutes += duration;
        }
        lastCheckin = null;
      } else if ((log.type === 'break' || log.type === 'lunch')) {
        lastBreakStart = log.timestamp;
        if (lastCheckin) {
          const workDuration = differenceInMinutes(log.timestamp, lastCheckin);
          if (!isNaN(workDuration) && workDuration > 0) {
            totalWorkMinutes += workDuration;
          }
          lastCheckin = null;
        }
      }
    });

    // Handle current ongoing session
    const now = new Date();
    if (lastCheckin && activityStatus === 'checked-in') {
      const duration = differenceInMinutes(now, lastCheckin);
      if (!isNaN(duration) && duration > 0) {
        totalWorkMinutes += duration;
      }
    } else if (lastBreakStart && (activityStatus === 'break' || activityStatus === 'lunch')) {
      const duration = differenceInMinutes(now, lastBreakStart);
      if (!isNaN(duration) && duration > 0) {
        totalBreakMinutes += duration;
      }
    }

    setWorkingTime(totalWorkMinutes);
    setTotalBreakTime(totalBreakMinutes);
  }, [activityStatus]);

  useEffect(() => {
    if (!firebaseUser) return;

    const statusUnsubscribe = onSnapshot(
      doc(db, 'monitoring', firebaseUser.uid),
      (snapshot: DocumentSnapshot) => {
        const data = snapshot.data() as ActivityDocument | undefined;
        if (data) {
          setActivityStatus(data.status || 'checked-out');
          if (data.lastActionTime) {
            let lastActionTime: Date;
            
            if (data.lastActionTime.toDate) {
              lastActionTime = data.lastActionTime.toDate();
            } else {
              lastActionTime = new Date(data.lastActionTime.seconds * 1000);
            }

            if (data.status === 'checked-in' && !lastCheckIn) {
              setLastCheckIn(lastActionTime);
            } else if (data.status === 'break' || data.status === 'lunch') {
              setBreakStartTime(lastActionTime);
            }
          }
        }
      }
    );

    // Get the start of the selected date in local timezone
    const queryStartDate = startOfDay(selectedDate);

    const logsQuery = query(
      collection(db, 'activityLogs'),
      where('userId', '==', firebaseUser.uid),
      where('timestamp', '>=', Timestamp.fromDate(queryStartDate)),
      orderBy('timestamp', 'desc')
    );

    const logsUnsubscribe = onSnapshot(logsQuery, (snapshot: QuerySnapshot) => {
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        let timestamp: Date;
        
        if (data.timestamp?.toDate) {
          timestamp = data.timestamp.toDate();
        } else if (data.timestamp) {
          timestamp = new Date(data.timestamp.seconds * 1000);
        } else {
          timestamp = new Date(data.createdAt);
        }

        return {
          id: doc.id,
          type: data.status as UserStatus,
          timestamp
        };
      }).filter((log: ActivityLog) => 
        log.timestamp instanceof Date && !isNaN(log.timestamp.getTime())
      );

      setActivityLogs(logs); // No need to sort again since Firestore will return them sorted
      
      // Only calculate times for today's logs
      if (isToday(selectedDate)) {
        calculateWorkingAndBreakTime(logs);
      } else {
        setWorkingTime(0);
        setTotalBreakTime(0);
      }
    });

    return () => {
      statusUnsubscribe();
      logsUnsubscribe();
    };
  }, [firebaseUser, lastCheckIn, calculateWorkingAndBreakTime, selectedDate]);

  const handleActivityChange = async (activity: UserStatus) => {
    if (!firebaseUser) return;

    const timestamp = new Date();
    
    if (activity === 'checked-in') {
      setLastCheckIn(timestamp);
      setCurrentSessionDuration(0);
      setWorkingTime(0);
    } else {
      if (lastCheckIn) {
        const duration = differenceInMinutes(timestamp, lastCheckIn);
        if (!isNaN(duration) && duration > 0) {
          setWorkingTime(prev => prev + duration);
        }
      }
      setLastCheckIn(null);
      setCurrentSessionDuration(0);
    }

    if (breakStartTime && (activity === 'checked-in' || activity === 'checked-out')) {
      const breakDuration = Math.floor((timestamp.getTime() - breakStartTime.getTime()) / 1000 / 60);
      if (!isNaN(breakDuration) && breakDuration > 0) {
        setTotalBreakTime(prev => prev + breakDuration);
      }
      setBreakStartTime(null);
      setCurrentBreakDuration(0);
    }

    if (activity === 'break' || activity === 'lunch') {
      setBreakStartTime(timestamp);
      setCurrentBreakDuration(0);
      if (lastCheckIn) {
        const duration = differenceInMinutes(timestamp, lastCheckIn);
        if (!isNaN(duration) && duration > 0) {
          setWorkingTime(prev => prev + duration);
        }
      }
      setLastCheckIn(null);
    }

    try {
      switch (activity) {
        case 'checked-in':
          await activityService.setUserOnline(firebaseUser);
          break;
        case 'checked-out':
          await activityService.setUserOffline(firebaseUser);
          break;
        case 'lunch':
          await activityService.setUserLunch(firebaseUser);
          break;
        case 'break':
          await activityService.setUserBreak(firebaseUser);
          break;
      }
    } catch (error) {
      console.error('Error updating activity status:', error);
    }
  };

  const getStatusColor = (status: UserStatus): string => {
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

  const getStatusBgColor = (status: UserStatus): string => {
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

  const getActivityIcon = (type: UserStatus) => {
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
        return <CheckOutIcon />;
    }
  };

  const getActivityColor = (type: UserStatus) => {
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

  const getStatusText = (status: UserStatus): string => {
    switch (status) {
      case 'checked-in':
        return 'Available';
      case 'checked-out':
        return 'Offline';
      case 'lunch':
        return 'Lunch Break';
      case 'break':
        return 'Short Break';
      default:
        return 'Offline';
    }
  };

  const calculateDailyBreaks = () => {
    const todayBreaks = activityLogs.filter(log => 
      (log.type === 'break' || log.type === 'lunch') && 
      isToday(log.timestamp)
    );
    
    return {
      totalBreaks: todayBreaks.length,
      lunchBreaks: todayBreaks.filter(log => log.type === 'lunch').length,
      shortBreaks: todayBreaks.filter(log => log.type === 'break').length,
    };
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesStatus = selectedStatus === 'all' || log.type === selectedStatus;
    const matchesDate = format(log.timestamp, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    return matchesStatus && matchesDate;
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        background: '#ffffff',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Activity Dashboard
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Status Card */}
          <Grid item xs={12} md={3}>
            <Card 
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                background: '#ffffff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                }
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getActivityIcon(activityStatus)}
                  <Typography variant="h6" sx={{ color: getStatusColor(activityStatus), fontWeight: 600 }}>
                    {getStatusText(activityStatus)}
                  </Typography>
                </Box>
                {(activityStatus === 'break' || activityStatus === 'lunch') && (
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <ClockIcon fontSize="small" />
                    <Typography variant="body2">
                      Current: {formatDuration(currentBreakDuration)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>

          {/* Time Tracking Card */}
          <Grid item xs={12} md={3}>
            <Card 
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                background: '#ffffff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                }
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Working Time
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TimerIcon color="success" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatDuration(workingTime)}
                  </Typography>
                </Box>
                {activityStatus === 'checked-in' && (
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <ClockIcon fontSize="small" />
                    <Typography variant="body2">
                      Session: {formatDuration(currentSessionDuration)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>

          {/* Break Summary Card */}
          <Grid item xs={12} md={3}>
            <Card 
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                background: '#ffffff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                }
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Break Summary
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LunchIcon color="warning" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Lunch Breaks: {calculateDailyBreaks().lunchBreaks}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BreakIcon color="warning" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Short Breaks: {calculateDailyBreaks().shortBreaks}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Card>
          </Grid>

          {/* Break Time Card */}
          <Grid item xs={12} md={3}>
            <Card 
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                background: '#ffffff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                }
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Break Time
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TimerIcon color="info" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatDuration(totalBreakTime)}
                  </Typography>
                </Box>
                {(activityStatus === 'break' || activityStatus === 'lunch') && (
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <ClockIcon fontSize="small" />
                    <Typography variant="body2">
                      Current: {formatDuration(currentBreakDuration)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Action Buttons */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        sx={{ 
          mb: 4,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <Button
          variant={activityStatus === 'checked-in' ? 'contained' : 'outlined'}
          startIcon={<CheckInIcon />}
          onClick={() => handleActivityChange('checked-in')}
          color="success"
          size="large"
          sx={{
            minWidth: 150,
            py: 1.5,
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
          size="large"
          sx={{
            minWidth: 150,
            py: 1.5,
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
          size="large"
          sx={{
            minWidth: 150,
            py: 1.5,
            transition: 'all 0.2s ease-in-out',
            transform: activityStatus === 'lunch' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          Lunch Break
        </Button>
        <Button
          variant={activityStatus === 'break' ? 'contained' : 'outlined'}
          startIcon={<BreakIcon />}
          onClick={() => handleActivityChange('break')}
          color="info"
          size="large"
          sx={{
            minWidth: 150,
            py: 1.5,
            transition: 'all 0.2s ease-in-out',
            transform: activityStatus === 'break' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          Short Break
        </Button>
      </Stack>

      {/* Activity History with Filters */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
            Activity History
          </Typography>
          <Stack direction="row" spacing={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue || new Date())}
                slotProps={{
                  textField: {
                    size: "small"
                  }
                }}
              />
            </LocalizationProvider>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="checked-in">Available</MenuItem>
                <MenuItem value="checked-out">Offline</MenuItem>
                <MenuItem value="lunch">Lunch Break</MenuItem>
                <MenuItem value="break">Short Break</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
        <Card 
          elevation={0}
          sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: 400,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <List 
            sx={{ 
              p: 0,
              overflow: 'auto',
              flexGrow: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f8f9fa',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#dee2e6',
                borderRadius: '4px',
                '&:hover': {
                  background: '#ced4da',
                },
              },
            }}
          >
            {filteredLogs.map((log, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getActivityColor(log.type)}.light`,
                        color: getActivityColor(log.type),
                      }}
                    >
                      {getActivityIcon(log.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {getStatusText(log.type)}
                        </Typography>
                        <Chip
                          label={format(log.timestamp, 'HH:mm:ss')}
                          size="small"
                          color={getActivityColor(log.type) as any}
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {format(log.timestamp, 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      </Box>
    </Paper>
  );
};

export default ActivityMonitor;
