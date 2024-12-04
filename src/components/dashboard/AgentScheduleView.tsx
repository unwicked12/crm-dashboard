import React, { useState } from 'react';
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

interface AgentSchedule {
  id: string;
  name: string;
  avatarUrl?: string;
  shift: {
    start: string;
    end: string;
  };
  tasks: {
    morning: 'call' | 'crm';
    afternoon: 'call' | 'crm';
  };
}

const AgentScheduleView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock data - replace with actual API data
  const generateMockAgents = (date: Date): AgentSchedule[] => {
    return [
      {
        id: '1',
        name: 'John Doe',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        shift: { start: '09:00', end: '17:00' },
        tasks: { morning: 'call', afternoon: 'crm' },
      },
      {
        id: '2',
        name: 'Jane Smith',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        shift: { start: '10:00', end: '18:00' },
        tasks: { morning: 'crm', afternoon: 'call' },
      },
      {
        id: '3',
        name: 'Mike Johnson',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        shift: { start: '08:00', end: '16:00' },
        tasks: { morning: 'call', afternoon: 'call' },
      },
    ];
  };

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

  const getTaskIcon = (task: 'call' | 'crm') => {
    return task === 'call' ? <CallIcon fontSize="small" /> : <CRMIcon fontSize="small" />;
  };

  const getTaskColor = (task: 'call' | 'crm') => {
    return task === 'call' ? 'primary' : 'secondary';
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
        const agents = generateMockAgents(day);

        // Cashsentinel brand colors
        const cashsentinelGreen = '#00B388';
        const cashsentinelGreenLight = '#E6F7F2';
        const cashsentinelGreenDark = '#008F6B';
        const cashsentinelBlue = '#144372';
        const cashsentinelBlueLight = '#E6EEF7';
        const cashsentinelBlueDark = '#0D2B4A';

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
                  ? cashsentinelBlue
                  : isTodays
                  ? cashsentinelGreen
                  : 'divider',
                bgcolor: isSelectedDay
                  ? cashsentinelBlue
                  : isTodays
                  ? cashsentinelGreenLight
                  : isCurrentMonth
                  ? 'background.paper'
                  : 'action.hover',
                '&:hover': {
                  bgcolor: isSelectedDay
                    ? cashsentinelBlueDark
                    : isTodays
                    ? cashsentinelGreen
                    : 'action.hover',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.1)',
                  pointerEvents: 'none',
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
                      ? cashsentinelGreenDark
                      : isCurrentMonth 
                      ? 'text.primary' 
                      : 'text.secondary',
                  }}
                >
                  {format(day, dateFormat)}
                </Typography>
                {isCurrentMonth && agents.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Badge
                      badgeContent={agents.length}
                      sx={{ 
                        '& .MuiBadge-badge': { 
                          position: 'static', 
                          transform: 'none',
                          color: isSelectedDay 
                            ? cashsentinelBlue
                            : isTodays
                            ? cashsentinelGreenDark
                            : '#fff',
                          bgcolor: isSelectedDay || isTodays
                            ? '#fff'
                            : isSelectedDay 
                            ? cashsentinelBlue 
                            : cashsentinelGreen,
                        } 
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: isSelectedDay
                          ? '#fff'
                          : isTodays
                          ? cashsentinelGreenDark
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

    const agents = generateMockAgents(selectedDate);

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
              {agents.map((agent) => (
                <TableRow 
                  key={agent.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={agent.avatarUrl}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Typography variant="body2">
                        {agent.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {agent.shift.start} - {agent.shift.end}
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
                          icon={getTaskIcon(agent.tasks.morning)}
                          label={agent.tasks.morning.toUpperCase()}
                          color={getTaskColor(agent.tasks.morning)}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Afternoon
                        </Typography>
                        <Chip
                          icon={getTaskIcon(agent.tasks.afternoon)}
                          label={agent.tasks.afternoon.toUpperCase()}
                          color={getTaskColor(agent.tasks.afternoon)}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
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
