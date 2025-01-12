import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoMode as AutoScheduleIcon,
} from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  isWeekend,
  addDays,
  isSaturday,
  isWednesday,
  getDay,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { userService, Schedule } from '../../services/userService';
import { scheduleService } from '../../services/scheduleService';

interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: string;
  tier: string;
}

const TeamCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSchedule, setNewSchedule] = useState<Omit<Schedule, 'id'>>({
    userId: '',
    date: new Date(),
    shift: '09:00-18:00',
    tasks: {
      morning: 'CALL',
      afternoon: 'CRM',
    },
  });
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  const [clearingSchedules, setClearingSchedules] = useState(false);

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
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const fetchedSchedules = await userService.getSchedules(monthStart, monthEnd);
        setSchedules(fetchedSchedules);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [currentDate]);

  const handleDateClick = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewSchedule({
      userId: '',
      date: new Date(),
      shift: '09:00-18:00',
      tasks: {
        morning: 'CALL',
        afternoon: 'CRM',
      },
    });
  };

  const handleAddSchedule = async () => {
    try {
      await userService.createSchedule(newSchedule);
      // Refresh schedules
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const fetchedSchedules = await userService.getSchedules(monthStart, monthEnd);
      setSchedules(fetchedSchedules);
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleAutoSchedule = async () => {
    try {
      console.log('Starting auto-schedule...');
      setAutoScheduleLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Clear existing schedules first
      console.log('Clearing existing schedules...');
      await scheduleService.clearAllSchedules();

      // Generate optimal schedules
      console.log('Generating new schedules...');
      const newSchedules = await scheduleService.generateSchedule(
        monthStart,
        monthEnd
      );
      console.log('Generated schedules:', newSchedules);

      // Create all new schedules
      console.log('Creating new schedules...');
      for (const schedule of newSchedules) {
        await userService.createSchedule({
          userId: schedule.userId,
          date: new Date(schedule.date),
          shift: schedule.shift,
          tasks: schedule.tasks
        });
      }

      // Refresh schedules
      console.log('Refreshing schedule display...');
      const fetchedSchedules = await userService.getSchedules(monthStart, monthEnd);
      console.log('Fetched schedules:', fetchedSchedules);
      setSchedules(fetchedSchedules);
      console.log('Auto-schedule complete!');
    } catch (error) {
      console.error('Error auto-scheduling:', error);
    } finally {
      setAutoScheduleLoading(false);
    }
  };

  const handleClearSchedules = async () => {
    if (!window.confirm('Are you sure you want to clear all schedules? This cannot be undone.')) {
      return;
    }

    try {
      setClearingSchedules(true);
      await scheduleService.clearAllSchedules();
      setSchedules([]);
    } catch (error) {
      console.error('Error clearing schedules:', error);
    } finally {
      setClearingSchedules(false);
    }
  };

  const getTaskTimeDisplay = (shift: string, timeSlot: 'AM' | 'PM') => {
    const [start, end] = shift.split('-');
    const startHour = parseInt(start);
    const endHour = parseInt(end);
    
    if (timeSlot === 'AM') {
      return `${start}:00-12:30`;
    } else {
      return `13:00-${end}:00`;
    }
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => 
      isSameDay(schedule.date, date)
    ).map(schedule => ({
      ...schedule,
      tasks: schedule.tasks || {
        morning: 'CALL',
        afternoon: 'CRM'
      }
    }));
  };

  const renderScheduleDetails = (date: Date) => {
    const dateSchedules = getSchedulesForDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const isExpanded = expandedDate === formattedDate;

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: !isSameMonth(date, currentDate)
                ? 'text.disabled'
                : isWeekend(date)
                ? 'error.main'
                : 'text.primary',
            }}
          >
            {format(date, 'd')}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleDateClick(formattedDate)}
            sx={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Stack spacing={0.5}>
          {dateSchedules.map((schedule) => {
            const user = users.find(u => u.id === schedule.userId);
            return (
              <Chip
                key={schedule.id}
                label={user?.name || schedule.userId}
                size="small"
                color="primary"
              />
            );
          })}
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={handlePrevMonth}>
          <PrevIcon />
        </IconButton>
        <Typography variant="h6">
          {format(currentDate, 'MMMM yyyy')}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <NextIcon />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearSchedules}
          disabled={clearingSchedules || autoScheduleLoading}
          sx={{ mr: 1 }}
        >
          Clear Schedules
        </Button>
        <Button
          variant="outlined"
          startIcon={<AutoScheduleIcon />}
          onClick={handleAutoSchedule}
          disabled={autoScheduleLoading || clearingSchedules}
          sx={{ mr: 1 }}
        >
          Auto Schedule
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Schedule
        </Button>
      </Box>

      <Grid container spacing={2}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid item xs={12/7} key={day}>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
        
        {getDaysInMonth().map((date) => (
          <Grid item xs={12/7} key={date.toString()}>
            <Card
              sx={{
                height: 'auto',
                minHeight: '120px',
                backgroundColor: isToday(date) ? 'action.hover' : 'background.paper',
                border: isSaturday(date) ? '2px solid #ff9800' : undefined,
                transition: 'all 0.3s ease',
                position: 'relative',
                opacity: !isSameMonth(date, currentDate) ? 0.5 : 1,
                '&:hover': {
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                {renderScheduleDetails(date)}
              </CardContent>
            </Card>
            <Collapse 
              in={expandedDate === format(date, 'yyyy-MM-dd')} 
              timeout="auto"
              sx={{
                position: 'absolute',
                zIndex: 1000,
                backgroundColor: 'white',
                width: '500px',
                boxShadow: 3,
                borderRadius: 1,
                mt: 1,
                transform: 'translateX(-25%)',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: -8,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: 16,
                  height: 16,
                  backgroundColor: 'white',
                  boxShadow: '-3px -3px 5px rgba(0,0,0,0.04)',
                },
              }}
            >
              {expandedDate === format(date, 'yyyy-MM-dd') && (
                <Box sx={{ p: 2 }}>
                  <TableContainer sx={{ overflowX: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Agent</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Shift</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Morning</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Afternoon</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getSchedulesForDate(date).map((schedule) => {
                          const user = users.find(u => u.id === schedule.userId);
                          return (
                            <TableRow key={schedule.id} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="body2">{user?.name || schedule.userId}</Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="body2">{schedule.shift}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                                  {schedule.tasks.morning}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                                  {getTaskTimeDisplay(schedule.shift, 'AM')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                                  {schedule.tasks.afternoon}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                                  {getTaskTimeDisplay(schedule.shift, 'PM')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Collapse>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={format(newSchedule.date, 'yyyy-MM-dd')}
              onChange={(e) => setNewSchedule({ ...newSchedule, date: new Date(e.target.value) })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Agent"
              value={newSchedule.userId}
              onChange={(e) => setNewSchedule({ ...newSchedule, userId: e.target.value })}
              fullWidth
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Shift"
              value={newSchedule.shift}
              onChange={(e) => setNewSchedule({ ...newSchedule, shift: e.target.value })}
              fullWidth
            >
              <MenuItem value="08:00-17:00">08:00 - 17:00</MenuItem>
              <MenuItem value="09:00-18:00">09:00 - 18:00</MenuItem>
              <MenuItem value="10:00-19:00">10:00 - 19:00</MenuItem>
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Morning Task"
                  value={newSchedule.tasks.morning}
                  onChange={(e) => setNewSchedule({
                    ...newSchedule,
                    tasks: { ...newSchedule.tasks, morning: e.target.value as 'CALL' | 'CRM' }
                  })}
                  fullWidth
                >
                  <MenuItem value="CALL">CALL</MenuItem>
                  <MenuItem value="CRM">CRM</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Afternoon Task"
                  value={newSchedule.tasks.afternoon}
                  onChange={(e) => setNewSchedule({
                    ...newSchedule,
                    tasks: { ...newSchedule.tasks, afternoon: e.target.value as 'CALL' | 'CRM' }
                  })}
                  fullWidth
                >
                  <MenuItem value="CALL">CALL</MenuItem>
                  <MenuItem value="CRM">CRM</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddSchedule} variant="contained" color="primary">
            Add Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamCalendar;
