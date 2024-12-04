import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format, parseISO, differenceInMinutes, startOfMonth, endOfMonth } from 'date-fns';
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface ActivityLog {
  type: string;
  timestamp: string | Date;
  userId?: string;
  userName?: string;
}

interface DailyWorkHours {
  id: string;
  date: string;
  hoursWorked: number;
  checkInTime: string;
  checkOutTime: string;
  breakTime: number;
  totalMinutes: number;
  userName?: string;
}

const MonthlyWorkReport: React.FC = () => {
  const theme = useTheme();
  const [workHours, setWorkHours] = useState<DailyWorkHours[]>([]);
  const [filteredHours, setFilteredHours] = useState<DailyWorkHours[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const currentUser = localStorage.getItem('currentUser') || '';

  const filterByMonth = (data: DailyWorkHours[], month: string) => {
    const start = startOfMonth(new Date(month));
    const end = endOfMonth(new Date(month));
    return data.filter(entry => {
      const date = new Date(entry.date);
      return date >= start && date <= end;
    });
  };

  useEffect(() => {
    const loadActivityLogs = () => {
      try {
        const rawLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]') as ActivityLog[];
        const savedLogs: ActivityLog[] = rawLogs.filter((log: ActivityLog) => log.userId === currentUser);

        const dailyLogs = savedLogs.reduce((acc: { [key: string]: ActivityLog[] }, log) => {
          const day = format(new Date(log.timestamp), 'yyyy-MM-dd');
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push({
            ...log,
            timestamp: new Date(log.timestamp)
          });
          return acc;
        }, {});

        const dailyWorkHours = Object.entries(dailyLogs).map(([date, logs]) => {
          logs.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          let totalWorkMinutes = 0;
          let breakMinutes = 0;
          let lastCheckIn: Date | null = null;
          let firstCheckIn = '';
          let lastCheckOut = '';
          let breakStartTime: Date | null = null;

          for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const timestamp = new Date(log.timestamp);

            switch (log.type) {
              case 'checked-in':
                if (!firstCheckIn) {
                  firstCheckIn = format(timestamp, 'HH:mm');
                }
                if (breakStartTime) {
                  breakMinutes += differenceInMinutes(timestamp, breakStartTime);
                  breakStartTime = null;
                }
                lastCheckIn = timestamp;
                break;

              case 'checked-out':
                if (lastCheckIn) {
                  const workMinutes = differenceInMinutes(timestamp, lastCheckIn);
                  totalWorkMinutes += workMinutes;
                  lastCheckIn = null;
                }
                lastCheckOut = format(timestamp, 'HH:mm');
                break;

              case 'break':
              case 'lunch':
                if (!breakStartTime) {
                  breakStartTime = timestamp;
                }
                break;
            }
          }

          const netWorkMinutes = Math.max(0, totalWorkMinutes);

          return {
            id: date,
            date,
            totalMinutes: netWorkMinutes,
            hoursWorked: Number((netWorkMinutes / 60).toFixed(2)),
            checkInTime: firstCheckIn || 'N/A',
            checkOutTime: lastCheckOut || 'N/A',
            breakTime: breakMinutes,
            userName: logs[0]?.userName
          };
        });

        setWorkHours(dailyWorkHours);
        setFilteredHours(filterByMonth(dailyWorkHours, selectedMonth));
      } catch (error) {
        console.error('Error processing activity logs:', error);
      }
    };

    if (currentUser) {
      loadActivityLogs();
    }
  }, [currentUser, selectedMonth]);

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Typography variant="body2">
            {format(parseISO(params.value), 'MMM dd, yyyy')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'checkInTime',
      headerName: 'Check In',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          icon={<TimeIcon />}
          sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.dark,
          }}
        />
      ),
    },
    {
      field: 'checkOutTime',
      headerName: 'Check Out',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          icon={<TimeIcon />}
          sx={{
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.dark,
          }}
        />
      ),
    },
    {
      field: 'hoursWorked',
      headerName: 'Hours Worked',
      width: 130,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'medium',
            color: theme.palette.primary.main,
          }}
        >
          {params.value}h
        </Typography>
      ),
    },
    {
      field: 'breakTime',
      headerName: 'Break Time',
      width: 130,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          {params.value}min
        </Typography>
      ),
    },
  ];

  const totalMinutes = filteredHours.reduce((sum, entry) => sum + entry.totalMinutes, 0);
  const totalHours = Number((totalMinutes / 60).toFixed(2));
  const totalBreakMinutes = filteredHours.reduce((sum, entry) => sum + entry.breakTime, 0);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        borderRadius: 2,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
              Monthly Work Report
            </Typography>
            {currentUser && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {workHours[0]?.userName || currentUser}
                </Typography>
              </Stack>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(new Date().getFullYear(), i, 1);
                  const value = format(date, 'yyyy-MM');
                  return (
                    <MenuItem key={value} value={value}>
                      {format(date, 'MMMM yyyy')}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <IconButton
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
              onClick={() => setSelectedMonth(format(new Date(), 'yyyy-MM'))}
            >
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={3}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Total Work Time
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'medium' }}>
              {totalHours}h ({totalMinutes}min)
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Total Break Time
            </Typography>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'medium' }}>
              {totalBreakMinutes}min
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          height: 400,
          width: '100%',
          '& .MuiDataGrid-root': {
            border: 'none',
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-cell': {
            borderColor: theme.palette.divider,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: '8px 8px 0 0',
          },
          '& .MuiDataGrid-columnHeader': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        <DataGrid
          rows={filteredHours}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:hover': {
              color: theme.palette.primary.main,
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default MonthlyWorkReport;
