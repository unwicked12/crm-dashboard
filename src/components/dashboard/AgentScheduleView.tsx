// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, ReactNode } from 'react';
import {
  Box,
  Paper,
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
  Badge,
  ButtonBase} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PhoneInTalk as CallIcon,
  Computer as CRMIcon,
  AccessTime as TimeIcon,
  Clear as ClearIcon} from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  isSameMonth,
  addDays,
  getDay} from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { userService, User, Schedule } from '../../services/userService';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AgentScheduleView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const fetchedSchedules = await userService.getSchedules(monthStart, monthEnd);
        setSchedules(fetchedSchedules);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
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
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const dateFormat = "d";
    const rows: JSX.Element[] = [];
    let days: JSX.Element[] = [];
    let day = startDate;

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

    // Create calendar rows
    while (day <= endDate) {
      days = [];
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const isCurrentMonth = isSameMonth(day, currentMonth);
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
                minHeight: 80,
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
                    : isCurrentMonth
                      ? 'background.paper'
                      : 'action.hover',
                opacity: isCurrentMonth ? 1 : 0.5,
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
                <Box sx={{ mt: 1, width: '100%' }}>
                  {daySchedules.slice(0, 2).map((schedule, index) => {
                    const user = users.find(u => u.id === schedule.userId);
                    return (
                      <Chip
                        key={index}
                        size="small"
                        label={user?.name.split(' ')[0] || 'Unknown'}
                        sx={{ 
                          mb: 0.5, 
                          width: '100%',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                    );
                  })}
                  
                  {daySchedules.length > 2 && (
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                      +{daySchedules.length - 2} more
                    </Typography>
                  )}
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
    }

    return (
      <Grid container spacing={1} direction="column">
        {rows}
      </Grid>
    );
  };

  const renderScheduleTable = () => {
    if (!selectedDate) return null;

    const daySchedules = getSchedulesForDate(selectedDate);

    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Schedule for {format(selectedDate, 'EEEE, MMMM d')}
          </Typography>
          <IconButton 
            onClick={clearDateFilter}
            size="small"
            sx={{ ml: 1 }}
            title="Clear selection"
          >
            <ClearIcon />
          </IconButton>
        </Box>
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
        <IconButton onClick={handlePrevMonth} size="small">
          <PrevIcon />
        </IconButton>
        
        <Typography variant="h6">
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>
        
        <IconButton onClick={handleNextMonth} size="small">
          <NextIcon />
        </IconButton>
      </Box>
      
      {/* Calendar */}
      {renderCalendar()}
      
      {/* Schedule details */}
      {selectedDate && renderScheduleTable()}
    </Box>
  );
};

export default AgentScheduleView;