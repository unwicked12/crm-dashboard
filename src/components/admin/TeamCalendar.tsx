import React, { useState } from 'react';
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
  AutoMode as AutoPlanIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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
} from 'date-fns';

type ShiftType = '08-17' | '09-18' | '10-19';
type TaskType = 'Calls' | 'CRM';
type TaskTimeSlot = 'AM' | 'PM';

interface AgentSchedule {
  agentId: string;
  shiftType: ShiftType;
  tasks: {
    morning: TaskType;
    afternoon: TaskType;
  };
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'special' | 'meeting' | 'saturday-shift' | 'day-off';
  employee: string;
  schedule?: AgentSchedule;
}

interface Employee {
  id: string;
  name: string;
  isOnHoliday?: boolean;
  lastSaturdayShift?: string;
}

const SHIFTS: ShiftType[] = ['08-17', '09-18', '10-19'];
const TASKS: TaskType[] = ['Calls', 'CRM'];

const TeamCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({
    title: '',
    date: '',
    type: 'meeting',
    employee: '',
    schedule: {
      agentId: '',
      shiftType: '09-18',
      tasks: {
        morning: 'Calls',
        afternoon: 'CRM',
      },
    },
  });

  // Mock employees data - replace with actual API call
  const [employees] = useState<Employee[]>([
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Mike Johnson' },
    { id: '4', name: 'Sarah Wilson' },
  ]);

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
    setNewEvent({
      title: '',
      date: '',
      type: 'meeting',
      employee: '',
      schedule: {
        agentId: '',
        shiftType: '09-18',
        tasks: {
          morning: 'Calls',
          afternoon: 'CRM',
        },
      },
    });
  };

  const handleAddEvent = () => {
    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      date: newEvent.date,
      type: newEvent.type,
      employee: newEvent.employee,
      schedule: newEvent.schedule,
    };
    setEvents([...events, event]);
    handleCloseDialog();
  };

  const getTaskTimeDisplay = (shiftType: ShiftType, timeSlot: TaskTimeSlot) => {
    const timeRanges = {
      '08-17': { AM: '09:00-12:30', PM: '13:00-17:00' },
      '09-18': { AM: '09:00-12:30', PM: '13:00-18:00' },
      '10-19': { AM: '10:00-12:30', PM: '13:00-19:00' },
    };
    return timeRanges[shiftType][timeSlot];
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) => format(parseISO(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getEventChipColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return 'error';
      case 'saturday-shift':
        return 'warning';
      case 'day-off':
        return 'success';
      case 'special':
        return 'warning';
      case 'meeting':
        return 'primary';
      default:
        return 'default';
    }
  };

  const renderScheduleDetails = (date: Date) => {
    const dateEvents = getEventsForDate(date);
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
          {dateEvents.map((event) => (
            <Chip
              key={event.id}
              label={`${event.title} - ${event.employee}`}
              size="small"
              color={getEventChipColor(event.type) as any}
            />
          ))}
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
                        {getEventsForDate(date)
                          .filter((event) => event.schedule)
                          .map((event) => (
                            <TableRow key={event.id} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="body2">{event.employee}</Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="body2">{event.schedule?.shiftType}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                                  {event.schedule?.tasks.morning}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                                  {getTaskTimeDisplay(event.schedule?.shiftType || '09-18', 'AM')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                                  {event.schedule?.tasks.afternoon}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                                  {getTaskTimeDisplay(event.schedule?.shiftType || '09-18', 'PM')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
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
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Employee"
              value={newEvent.employee}
              onChange={(e) => setNewEvent({ ...newEvent, employee: e.target.value })}
              fullWidth
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.name}>
                  {emp.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Shift"
              value={newEvent.schedule?.shiftType}
              onChange={(e) =>
                setNewEvent({
                  ...newEvent,
                  schedule: { ...newEvent.schedule!, shiftType: e.target.value as ShiftType },
                })
              }
              fullWidth
            >
              {SHIFTS.map((shift) => (
                <MenuItem key={shift} value={shift}>
                  {shift}
                </MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Morning Task"
                  value={newEvent.schedule?.tasks.morning}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      schedule: {
                        ...newEvent.schedule!,
                        tasks: { ...newEvent.schedule!.tasks, morning: e.target.value as TaskType },
                      },
                    })
                  }
                  fullWidth
                >
                  {TASKS.map((task) => (
                    <MenuItem key={task} value={task}>
                      {task}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Afternoon Task"
                  value={newEvent.schedule?.tasks.afternoon}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      schedule: {
                        ...newEvent.schedule!,
                        tasks: { ...newEvent.schedule!.tasks, afternoon: e.target.value as TaskType },
                      },
                    })
                  }
                  fullWidth
                >
                  {TASKS.map((task) => (
                    <MenuItem key={task} value={task}>
                      {task}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddEvent} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamCalendar;
