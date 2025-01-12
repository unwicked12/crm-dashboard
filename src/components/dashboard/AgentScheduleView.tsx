import React, { useState, useEffect } from 'react';
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
  ButtonBase,
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PhoneInTalk as CallIcon,
  Computer as CRMIcon,
  AccessTime as TimeIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday,
  isSameMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addDays,
  getDay,
} from 'date-fns';
import { userService, User, Schedule } from '../../services/userService';

const AgentScheduleView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (isSameMonth(date, currentMonth)) {
      if (selectedDate && isSameDay(date, selectedDate)) {
        setSelectedDate(null);
      } else {
        setSelectedDate(date);
      }
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
    const rows = [];
    let days = [];
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

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
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
                minHeight: 90,
                borderRadius: 1,
                transition: 'all 0.2s',
                position: 'relative',
                border: '1px solid',
                borderColor: isSelectedDay 
                  ? 'primary.main'
                  : isTodays
                  ? 'success.main'
                  : 'divider',
                bgcolor: isSelectedDay
                  ? 'primary.main'
                  : isTodays
                  ? 'success.light'
                  : isCurrentMonth
                  ? 'background.paper'
                  : 'action.hover',
                '&:hover': {
                  bgcolor: isSelectedDay
                    ? 'primary.dark'
                    : isTodays
                    ? 'success.main'
                    : 'action.hover',
                },
              }}
            >
              <Stack 
                spacing={0.5} 
                sx={{ 
                  p: 1, 
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: (isSelectedDay || isTodays) ? 'bold' : 'normal',
                    color: isSelectedDay
                      ? '#fff'
                      : isTodays
                      ? 'success.dark'
                      : isCurrentMonth 
                      ? 'text.primary' 
                      : 'text.secondary',
                  }}
                >
                  {format(day, dateFormat)}
                </Typography>
                {isCurrentMonth && daySchedules.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Badge
                      badgeContent={daySchedules.length}
                      color={isSelectedDay ? 'secondary' : 'primary'}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: isSelectedDay
                          ? '#fff'
                          : isTodays
                          ? 'success.dark'
                          : 'text.secondary',
                        fontSize: '0.7rem',
                      }}
                    >
                      agents
                    </Typography>
                  </Box>
                )}
              </Stack>
            </ButtonBase>
          </Grid>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <Grid container item spacing={0.5} key={day.toString()}>
          {days}
        </Grid>
      );
      days = [];
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
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ flex: 1 }}>
            Monthly Schedule
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePrevMonth}>
              <PrevIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mx: 2 }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <NextIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {renderCalendar()}
      {renderScheduleTable()}
    </Paper>
  );
};

export default AgentScheduleView;
