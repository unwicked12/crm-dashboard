// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, useCallback, ReactElement } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
  useTheme,
  Card,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
} from '@mui/material';
import {
  PlayArrow as CheckInIcon,
  Stop as CheckOutIcon,
  Restaurant as LunchIcon,
  Coffee as BreakIcon,
  AccessTime as ClockIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format, differenceInMinutes, isToday } from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '../../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { activityService } from '../../services/activityService';
import { 
  doc,
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { 
  FirestoreDocument,
  FirestoreQueryDoc,
  FirestoreQueryResult,
  ActivityDocument,
  ActivityLog,
  ActivityLogType
} from '../../types/firebase-types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db } from '../../firebase';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ActivityMonitor = (): ReactElement => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activityStatus, setActivityStatus] = useState<ActivityDocument['status']>('checked-out');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalBreakTime, setTotalBreakTime] = useState<number>(0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workingTime, setWorkingTime] = useState<number>(0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentBreakDuration, setCurrentBreakDuration] = useState<number>(0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateWorkingAndBreakTime = useCallback((logs: ActivityLog[]) => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    let lastCheckin: Date | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    let lastBreakStart: Date | null = null;

    // Sort logs chronologically for calculation
    const chronologicalLogs = [...logs]
      .filter(log => log && log.timestamp) // Filter out logs with null timestamps
      .sort((a, b) => {
        try {
          if (!a.timestamp || !b.timestamp) return 0;
          return a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime();
        } catch (error) {
          console.error("Error sorting logs:", error);
          return 0;
        }
      });

    chronologicalLogs.forEach((log) => {
      try {
        if (!log.timestamp) return; // Skip logs with null timestamps
        const currentTimestamp = log.timestamp.toDate();
        
        // Skip logs with undefined type
        if (!log.type) {
          // Removed console.log
          return;
        }
        
        // Handle different log types with switch statement
        switch (log.type) {
          case 'checked-in':
            lastCheckin = currentTimestamp;
            if (isToday(currentTimestamp)) {
              setLastCheckIn(currentTimestamp);
            }
            break;
            
          case 'checked-out':
            if (lastCheckin) {
              const sessionMinutes = differenceInMinutes(currentTimestamp, lastCheckin);
              totalWorkMinutes += sessionMinutes > 0 ? sessionMinutes : 0;
              lastCheckin = null;
            }
            break;
            
          case 'break-start':
            lastBreakStart = currentTimestamp;
            break;
            
          case 'break-end':
            if (lastBreakStart) {
              const breakMinutes = differenceInMinutes(currentTimestamp, lastBreakStart);
              totalBreakMinutes += breakMinutes > 0 ? breakMinutes : 0;
              lastBreakStart = null;
            }
            break;
            
          case 'lunch-start':
            lastBreakStart = currentTimestamp;
            break;
            
          case 'lunch-end':
            if (lastBreakStart) {
              const breakMinutes = differenceInMinutes(currentTimestamp, lastBreakStart);
              totalBreakMinutes += breakMinutes > 0 ? breakMinutes : 0;
              lastBreakStart = null;
            }
            break;
            
          // Handle standard activity statuses as well
          case 'break':
          case 'lunch':
            // These are status updates, not start/end events
            break;
            
          default:
            // Log unexpected types for debugging
            // Removed console.log
            break;
        }
      } catch (error) {
        console.error("Error processing log:", error, log);
      }
    });

    // If still checked in, calculate time until now
    if (lastCheckin) {
      const now = new Date();
      const ongoingMinutes = differenceInMinutes(now, lastCheckin);
      if (ongoingMinutes > 0) {
        totalWorkMinutes += ongoingMinutes;
      }
    }

    // If still on break, calculate time until now
    if (lastBreakStart) {
      const now = new Date();
      const ongoingBreakMinutes = differenceInMinutes(now, lastBreakStart);
      if (ongoingBreakMinutes > 0) {
        totalBreakMinutes += ongoingBreakMinutes;
        setBreakStartTime(lastBreakStart);
        setCurrentBreakDuration(ongoingBreakMinutes);
      }
    } else {
      setBreakStartTime(null);
      setCurrentBreakDuration(0);
    }

    setWorkingTime(totalWorkMinutes);
    setTotalBreakTime(totalBreakMinutes);

    // Calculate current session duration if checked in
    if (lastCheckIn && activityStatus === 'checked-in') {
      const now = new Date();
      const sessionDuration = differenceInMinutes(now, lastCheckIn);
      setCurrentSessionDuration(sessionDuration > 0 ? sessionDuration : 0);
    } else {
      setCurrentSessionDuration(0);
    }
  }, [activityStatus]);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Get today's logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const logsQuery = query(
        collection(db, 'activityLogs'),
        where('userId', '==', user.uid),
        where('timestamp', '>=', today),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(
        logsQuery, 
        (snapshot) => {
          // Use type assertion for snapshot.docs
          const logs = snapshot.docs
            .map((doc) => {
              // Use type assertion for doc.data()
              const data = doc.data() as ActivityLog;
              return {
                ...data,
                id: doc.id
              } as ActivityLog;
            })
            .filter((log) => log && log.timestamp); // Filter out logs with null timestamps
          
          setActivityLogs(logs);
          calculateWorkingAndBreakTime(logs);
          setLoading(false);
        }, 
        (error) => {
          console.error("Error fetching activity logs:", error);
          setError("Failed to load activity data");
          setLoading(false);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up activity logs listener:", error);
      setError("Failed to connect to activity service");
      setLoading(false);
    }
  }, [user, calculateWorkingAndBreakTime]);

  // Fetch current activity status
  const fetchActivityStatus = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const activityDocRef = doc(db, 'activities', user.uid);
      
      const unsubscribe = onSnapshot(
        activityDocRef, 
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            // Use type assertion for docSnapshot.data()
            const data = docSnapshot.data() as ActivityDocument;
            setActivityStatus(data.status || 'checked-out');
          } else {
            setActivityStatus('checked-out');
          }
        }, 
        (error) => {
          console.error("Error fetching activity status:", error);
          setError("Failed to load status");
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up activity status listener:", error);
      setError("Failed to connect to status service");
    }
  }, [user]);

  // Initialize data
  useEffect(() => {
    let unsubscribeLogs: (() => void) | undefined;
    let unsubscribeStatus: (() => void) | undefined;
    
    if (user?.uid) {
      const setupSubscriptions = async () => {
        unsubscribeLogs = await fetchActivityLogs();
        unsubscribeStatus = await fetchActivityStatus();
      };
      
      setupSubscriptions();
    }
    
    // Cleanup subscriptions
    return () => {
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, [user, fetchActivityLogs, fetchActivityStatus]);

  // Update current durations every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      calculateWorkingAndBreakTime(activityLogs);
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [activityLogs, calculateWorkingAndBreakTime]);

  // Format time display (hours and minutes)
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Handle activity actions
  const handleCheckIn = async () => {
    if (!user?.uid) return;
    try {
      await activityService.checkIn(user.uid);
    } catch (error) {
      console.error("Error checking in:", error);
      setError("Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    if (!user?.uid) return;
    try {
      await activityService.checkOut(user.uid);
    } catch (error) {
      console.error("Error checking out:", error);
      setError("Failed to check out");
    }
  };

  const handleStartBreak = async () => {
    if (!user?.uid) return;
    try {
      await activityService.startBreak(user.uid);
    } catch (error) {
      console.error("Error starting break:", error);
      setError("Failed to start break");
    }
  };

  const handleEndBreak = async () => {
    if (!user?.uid) return;
    try {
      await activityService.endBreak(user.uid);
    } catch (error) {
      console.error("Error ending break:", error);
      setError("Failed to end break");
    }
  };

  const handleStartLunch = async () => {
    if (!user?.uid) return;
    try {
      await activityService.startLunch(user.uid);
    } catch (error) {
      console.error("Error starting lunch:", error);
      setError("Failed to start lunch");
    }
  };

  const handleEndLunch = async () => {
    if (!user?.uid) return;
    try {
      await activityService.endLunch(user.uid);
    } catch (error) {
      console.error("Error ending lunch:", error);
      setError("Failed to end lunch");
    }
  };

  // Render activity monitor
  return (
    <Box>
      <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell component="th" sx={{ fontWeight: 'bold', width: '30%' }}>
                Current Status
              </TableCell>
              <TableCell>
                <Chip
                  label={
                    activityStatus === 'checked-in' ? 'Working' :
                    activityStatus === 'break' ? 'On Break' :
                    activityStatus === 'lunch' ? 'At Lunch' :
                    'Checked Out'
                  }
                  color={
                    activityStatus === 'checked-in' ? 'success' :
                    activityStatus === 'break' || activityStatus === 'lunch' ? 'warning' :
                    'error'
                  }
                  size="small"
                />
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                Working Time
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ClockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  {formatTime(workingTime)}
                </Box>
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                Break Time
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimerIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  {formatTime(totalBreakTime)}
                </Box>
              </TableCell>
            </TableRow>
            
            {(activityStatus === 'break' || activityStatus === 'lunch') && breakStartTime && (
              <TableRow>
                <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                  Current {activityStatus === 'lunch' ? 'Lunch' : 'Break'}
                </TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'inline-block',
                    p: 0.5, 
                    bgcolor: 'warning.light', 
                    borderRadius: 1,
                    color: 'warning.contrastText'
                  }}>
                    {formatTime(currentBreakDuration)}
                  </Box>
                </TableCell>
              </TableRow>
            )}
            
            {activityStatus === 'checked-in' && lastCheckIn && (
              <TableRow>
                <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                  Current Session
                </TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'inline-block',
                    p: 0.5, 
                    bgcolor: 'success.light', 
                    borderRadius: 1,
                    color: 'success.contrastText'
                  }}>
                    {formatTime(currentSessionDuration)}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Divider sx={{ mb: 2 }} />
      
      <Stack direction="row" spacing={1}>
        {activityStatus === 'checked-out' ? (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckInIcon />}
            onClick={handleCheckIn}
            fullWidth
          >
            Check In
          </Button>
        ) : activityStatus === 'checked-in' ? (
          <>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<BreakIcon />}
              onClick={handleStartBreak}
            >
              Break
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LunchIcon />}
              onClick={handleStartLunch}
            >
              Lunch
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CheckOutIcon />}
              onClick={handleCheckOut}
            >
              Out
            </Button>
          </>
        ) : activityStatus === 'break' ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleEndBreak}
            fullWidth
          >
            End Break
          </Button>
        ) : activityStatus === 'lunch' ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleEndLunch}
            fullWidth
          >
            End Lunch
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
};

export default ActivityMonitor;