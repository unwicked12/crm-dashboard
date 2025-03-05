import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Avatar,
  Grid,
  ButtonBase
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PhoneInTalk as CallIcon,
  Computer as CRMIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  addDays
} from 'date-fns';
import { userService, User, Schedule } from '../../services/userService';

const WeekScheduleView: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Initialize with today's date
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await userService.getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const weekStart = startOfWeek(currentWeek);
        const weekEnd = endOfWeek(currentWeek);
        const fetchedSchedules = await userService.getSchedules(weekStart, weekEnd);
        setSchedules(fetchedSchedules);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [currentWeek]);

  // Set the selected date to today when the component mounts or week changes
  useEffect(() => {
    // Find a date in the current week that has schedules
    const weekStart = startOfWeek(currentWeek);
    const today = new Date();
    
    // If today is in the current week, select today
    if (today >= weekStart && today <= endOfWeek(currentWeek)) {
      setSelectedDate(today);
    } else {
      // Otherwise, select the first day of the week
      setSelectedDate(weekStart);
    }
  }, [currentWeek]);

  const handlePrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const getTaskIcon = (task: 'CALL' | 'CRM') => {
    return task === 'CALL' ? <CallIcon fontSize="small" /> : <CRMIcon fontSize="small" />;
  };

  const getTaskColor = (task: 'CALL' | 'CRM') => {
    return task === 'CALL' ? 'primary' : 'secondary';
  };

  const getSchedulesForDate = (date: Date): Schedule[] => {
    return schedules.filter(schedule => 
      isSameDay(schedule.date, date)
    );
  };

  const renderCalendar = () => {
    const weekStart = startOfWeek(currentWeek);
    const weekEnd = endOfWeek(currentWeek);
    
    const dateFormat = "d";
    const rows: JSX.Element[] = [];
    let days: JSX.Element[] = [];
    let day = weekStart;

    // Add week day headers
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayHeaders = weekDays.map((dayName) => (
      <Grid item xs key={dayName}>
        <Typography
          variant="subtitle2"
          align="center"
          sx={{ 
            fontWeight: 'bold',
            color: 'text.secondary',
            mb: 1
          }}
        >
          {dayName}
        </Typography>
      </Grid>
    ));
    rows.push(
      <Grid container item spacing={0} key="header">
        {dayHeaders}
      </Grid>
    );

    days = [];
    for (let i = 0; i < 7; i++) {
      const cloneDay = new Date(day);
      const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
      const isTodays = isToday(day);
      const daySchedules = getSchedulesForDate(day);

      days.push(
        <Grid item xs key={day.toString()}>
          <ButtonBase
            onClick={() => handleDateClick(cloneDay)}
            sx={{
              width: '100%',
              height: '100%',
              minHeight: 70,
              borderRadius: 1,
              transition: 'all 0.2s',
              position: 'relative',
              border: '1px solid',
              borderColor: isSelectedDay 
                ? 'primary.main'
                : isTodays
                  ? 'secondary.main'
                  : 'divider',
              bgcolor: isSelectedDay 
                ? 'primary.light' 
                : isTodays
                  ? 'secondary.light'
                  : 'background.paper',
              '&:hover': {
                bgcolor: isSelectedDay 
                  ? 'primary.light' 
                  : 'action.hover',
                transform: 'scale(1.02)',
              },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              p: 1,
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: isTodays ? 'bold' : 'normal',
                color: isSelectedDay 
                  ? 'primary.contrastText' 
                  : isTodays
                    ? 'secondary.contrastText'
                    : 'text.primary',
              }}
            >
              {format(day, dateFormat)}
            </Typography>
            
            {daySchedules.length > 0 && (
              <Box sx={{ mt: 1, width: '100%', textAlign: 'center' }}>
                <Chip
                  size="small"
                  label={`${daySchedules.length} ${daySchedules.length > 1 ? '' : ''}`}
                  color={isSelectedDay ? "primary" : "default"}
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              </Box>
            )}
          </ButtonBase>
        </Grid>
      );
      
      day = addDays(day, 1);
    }
    
    rows.push(
      <Grid container item spacing={0} key={day.toString()}>
        {days}
      </Grid>
    );

    return (
      <Grid container spacing={1} direction="column">
        {rows}
      </Grid>
    );
  };

  const renderScheduleTable = () => {
    const daySchedules = getSchedulesForDate(selectedDate);

    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Schedule for {format(selectedDate, 'EEEE, MMMM d')}
          </Typography>
        </Box>
        {daySchedules.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '25%', fontWeight: 'bold' }}>
                    Agent
                  </TableCell>
                  <TableCell sx={{ width: '20%', fontWeight: 'bold' }}>
                    Schedule
                  </TableCell>
                  <TableCell sx={{ width: '55%', fontWeight: 'bold' }}>
                    Tasks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {daySchedules.map((schedule) => {
                  const user = users.find(u => u.id === schedule.userId);
                  return (
                    <TableRow 
                      key={schedule.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar>
                            {user?.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {user?.name || 'Unknown User'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TimeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {schedule.shift}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                              Morning
                            </Typography>
                            <Chip
                              icon={getTaskIcon(schedule.tasks.morning)}
                              label={schedule.tasks.morning}
                              color={getTaskColor(schedule.tasks.morning)}
                              size="small"
                            />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                              Afternoon
                            </Typography>
                            <Chip
                              icon={getTaskIcon(schedule.tasks.afternoon)}
                              label={schedule.tasks.afternoon}
                              color={getTaskColor(schedule.tasks.afternoon)}
                              size="small"
                            />
                          </Box>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No schedules available for this day
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Header with navigation */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <IconButton onClick={handlePrevWeek} size="small">
          <PrevIcon />
        </IconButton>
        
        <Typography variant="h6">
          Week of {format(startOfWeek(currentWeek), 'MMM d')} - {format(endOfWeek(currentWeek), 'MMM d, yyyy')}
        </Typography>
        
        <IconButton onClick={handleNextWeek} size="small">
          <NextIcon />
        </IconButton>
      </Box>
      
      {/* Calendar */}
      {renderCalendar()}
      
      {/* Schedule details - always shown */}
      {renderScheduleTable()}
    </Box>
  );
};

export default WeekScheduleView; 