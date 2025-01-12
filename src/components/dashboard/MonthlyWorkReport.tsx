import React, { useEffect, useState, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format, parseISO, differenceInMinutes, startOfMonth, endOfMonth, getWeek, getWeeksInMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import type { 
  QuerySnapshot,
  QueryDocumentSnapshot 
} from '@firebase/firestore-types';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SignaturePad from 'react-signature-pad-wrapper';

// Extend jsPDF with autoTable
interface JsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => JsPDFWithAutoTable;
}

interface ActivityLog {
  type: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  status?: string;
  createdAt?: string;
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
  status: 'under' | 'over' | 'optimal';
  scheduleType: 'standard' | 'short';
}

interface SignatureData {
  signatureUrl: string;
  date: string;
}

const WORK_STANDARDS = {
  STANDARD_SCHEDULE: {
    DAILY_HOURS: 9,
    WEEKLY_HOURS: 40,
    MIN_DAILY_HOURS: 8.5,
    MAX_DAILY_HOURS: 9.5,
  },
  SHORT_SCHEDULE: {
    DAILY_HOURS: 8,
    WEEKLY_HOURS: 39,
    MIN_DAILY_HOURS: 7.5,
    MAX_DAILY_HOURS: 8.5,
  },
  EXPECTED_BREAK: 60, // minutes
};

const MonthlyWorkReport: React.FC = () => {
  const theme = useTheme();
  const { firebaseUser } = useAuth();
  const [workHours, setWorkHours] = useState<DailyWorkHours[]>([]);
  const [filteredHours, setFilteredHours] = useState<DailyWorkHours[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [scheduleType, setScheduleType] = useState<'standard' | 'short'>('standard');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [userName, setUserName] = useState<string>('');
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const signatureRef = useRef<SignaturePad>(null);

  // Add new useEffect to fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!firebaseUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || userData.displayName || 'Unknown Agent');
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  }, [firebaseUser]);

  const filterByMonth = (data: DailyWorkHours[], month: string, weekFilter: string) => {
    const monthDate = new Date(month);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    return data.filter(entry => {
      const date = new Date(entry.date);
      if (weekFilter === 'all') {
        return date >= start && date <= end;
      } else {
        const weekNum = Number(weekFilter);
        const entryWeek = getWeek(date) - getWeek(start) + 1;
        return entryWeek === weekNum && date >= start && date <= end;
      }
    });
  };

  const getWorkStatus = (hoursWorked: number, breakTime: number): 'under' | 'over' | 'optimal' => {
    const schedule = scheduleType === 'standard' ? WORK_STANDARDS.STANDARD_SCHEDULE : WORK_STANDARDS.SHORT_SCHEDULE;
    
    if (breakTime < WORK_STANDARDS.EXPECTED_BREAK - 15) return 'under'; // Break too short
    if (hoursWorked < schedule.MIN_DAILY_HOURS) return 'under';
    if (hoursWorked > schedule.MAX_DAILY_HOURS) return 'over';
    return 'optimal';
  };

  const calculateDayMinutes = (logs: ActivityLog[]): { totalMinutes: number; breakMinutes: number } => {
    let totalMinutes = 0;
    let breakMinutes = 0;
    let lastCheckIn: Date | null = null;
    let breakStartTime: Date | null = null;

    // Sort logs by timestamp to ensure correct order
    const sortedLogs = [...logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    sortedLogs.forEach((log, index) => {
      const timestamp = log.timestamp;
      const nextLog = sortedLogs[index + 1];

      switch (log.type) {
        case 'checked-in':
          lastCheckIn = timestamp;
          if (breakStartTime) {
            const breakDuration = differenceInMinutes(timestamp, breakStartTime);
            if (breakDuration > 0) breakMinutes += breakDuration;
            breakStartTime = null;
          }
          break;

        case 'checked-out':
          if (lastCheckIn) {
            const workDuration = differenceInMinutes(timestamp, lastCheckIn);
            if (workDuration > 0) totalMinutes += workDuration;
            lastCheckIn = null;
          }
          break;

        case 'break':
        case 'lunch':
          if (lastCheckIn) {
            const workDuration = differenceInMinutes(timestamp, lastCheckIn);
            if (workDuration > 0) totalMinutes += workDuration;
            lastCheckIn = null;
          }
          breakStartTime = timestamp;
          break;
      }

      // If this is the last log of the day
      if (!nextLog) {
        const now = new Date();
        if (log.type === 'checked-in' && lastCheckIn) {
          const workDuration = differenceInMinutes(now, lastCheckIn);
          if (workDuration > 0) totalMinutes += workDuration;
        } else if ((log.type === 'break' || log.type === 'lunch') && breakStartTime) {
          const breakDuration = differenceInMinutes(now, breakStartTime);
          if (breakDuration > 0) breakMinutes += breakDuration;
        }
      }
    });

    return { totalMinutes, breakMinutes };
  };

  const handleSign = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current.toDataURL('image/png');
      setSignature({
        signatureUrl: signatureData,
        date: format(new Date(), 'dd/MM/yyyy HH:mm')
      });
      setOpenSignDialog(false);
      generatePDF();
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add simple header
    doc.setFillColor(25, 33, 57);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Fiche de présence', pageWidth / 2, 17, { align: 'center' });

    // Add report info box
    doc.setFillColor(247, 248, 250);
    doc.rect(0, 25, pageWidth, 35, 'F');
    doc.setTextColor(25, 33, 57);
    doc.setFontSize(12);
    doc.text('Détails de l\'Agent', 20, 40);
    
    // Add agent info in two columns
    doc.setFontSize(10);
    // Left column
    doc.text('Nom de l\'Agent:', 20, 50);
    doc.text('Période:', 20, 55);
    // Right column - bold values
    doc.setFont(undefined, 'bold');
    doc.text(userName || 'Agent Inconnu', 80, 50);
    doc.text(`${selectedWeek === 'all' 
      ? format(new Date(selectedMonth), 'MMMM yyyy')
      : `Semaine ${selectedWeek} - ${format(new Date(selectedMonth), 'MMMM yyyy')}`}`, 
      80, 55
    );

    // Add summary boxes without icons
    const boxes = [
      { 
        label: 'Heures Totales',
        value: `${totalHours}h`,
        color: totalHours >= 40 ? '#10B981' : '#F59E0B'
      },
      { 
        label: 'Temps de Pause',
        value: `${totalBreakMinutes}min`,
        color: '#6366F1'
      },
      { 
        label: 'Type d\'Horaire',
        value: scheduleType === 'standard' ? '40h/sem' : '39h/sem',
        color: '#8B5CF6'
      }
    ];

    boxes.forEach((box, index) => {
      const boxWidth = (pageWidth - 60) / 3;
      const x = 20 + (index * (boxWidth + 10));
      // Box background
      doc.setFillColor(247, 248, 250);
      doc.roundedRect(x, 70, boxWidth, 30, 3, 3, 'F');
      // Label and value
      doc.setTextColor(25, 33, 57);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(box.label, x + 10, 82);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(box.color);
      doc.text(box.value, x + 10, 92);
    });

    // Add activity table with modern styling
    const tableData = filteredHours.map(row => [
      format(parseISO(row.date), 'dd MMM yyyy'),
      row.checkInTime,
      row.checkOutTime,
      `${row.hoursWorked}h`,
      `${row.breakTime}min`,
      {
        content: row.status === 'optimal' ? 'Optimal' :
                row.status === 'under' ? 'Insuffisant' : 'Excès',
        styles: {
          textColor: row.status === 'optimal' ? '#10B981' : 
                    row.status === 'under' ? '#F59E0B' : '#EF4444',
          fontStyle: 'bold'
        }
      }
    ]);

    const finalY = (doc as any).autoTable({
      startY: 110,
      head: [['Date', 'Arrivée', 'Départ', 'Heures', 'Pause', 'Statut']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 6,
        lineColor: [230, 232, 235],
        lineWidth: 0.5,
        font: 'helvetica',
        textColor: [25, 33, 57]
      },
      headStyles: {
        fillColor: [41, 52, 85],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [247, 248, 250]
      },
    });

    // Add signature section
    if (signature?.signatureUrl) {
      const signatureY = (finalY as number) + 20;
      
      // Add signature title
      doc.setTextColor(25, 33, 57);
      doc.setFontSize(10);
      doc.text('Signature de l\'Agent:', 20, signatureY + 15);

      // Add signature directly from data URL
      doc.addImage(
        signature.signatureUrl,
        20,
        signatureY + 20,
        80,
        30
      );

      // Add signature date
      doc.setFontSize(8);
      doc.text(`Signé le: ${signature.date}`, 20, signatureY + 55);
    }

    // Save the PDF
    const monthName = format(new Date(selectedMonth), 'MMMM-yyyy');
    const sanitizedAgentName = userName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    doc.save(`${sanitizedAgentName}-${monthName}-signe.pdf`);
  };

  useEffect(() => {
    if (!firebaseUser) return;

    const monthStart = startOfMonth(new Date(selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedMonth));

    const logsQuery = query(
      collection(db, 'activityLogs'),
      where('userId', '==', firebaseUser.uid),
      where('timestamp', '>=', Timestamp.fromDate(monthStart)),
      where('timestamp', '<=', Timestamp.fromDate(monthEnd)),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot: QuerySnapshot) => {
      try {
        const logs: ActivityLog[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          let timestamp: Date;
          
          if (data.timestamp?.toDate) {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp) {
            timestamp = new Date(data.timestamp.seconds * 1000);
          } else {
            timestamp = new Date(data.createdAt);
          }

          // Use the Firebase display name consistently
          const userName = firebaseUser.displayName || 'Unknown Agent';

          return {
            type: data.status || data.type,
            userId: data.userId,
            userName,
            timestamp,
            createdAt: data.createdAt
          };
        });

        const dailyLogs = logs.reduce((acc: { [key: string]: ActivityLog[] }, log) => {
          const day = format(log.timestamp, 'yyyy-MM-dd');
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push(log);
          return acc;
        }, {});

        const dailyWorkHours: DailyWorkHours[] = Object.entries(dailyLogs).map(([date, logs]) => {
          const { totalMinutes, breakMinutes } = calculateDayMinutes(logs);
          const hoursWorked = Number((totalMinutes / 60).toFixed(2));
          const status = getWorkStatus(hoursWorked, breakMinutes);

          return {
            id: date,
            date,
            totalMinutes,
            hoursWorked,
            checkInTime: logs.find(log => log.type === 'checked-in')?.timestamp 
              ? format(logs.find(log => log.type === 'checked-in')!.timestamp, 'HH:mm')
              : 'N/A',
            checkOutTime: logs.find(log => log.type === 'checked-out')?.timestamp
              ? format(logs.find(log => log.type === 'checked-out')!.timestamp, 'HH:mm')
              : 'N/A',
            breakTime: breakMinutes,
            userName: logs[0]?.userName,
            status,
            scheduleType
          };
        });

        setWorkHours(dailyWorkHours);
        setFilteredHours(filterByMonth(dailyWorkHours, selectedMonth, selectedWeek));
      } catch (error) {
        console.error('Error processing activity logs:', error);
      }
    });

    return () => unsubscribe();
  }, [firebaseUser, selectedMonth, scheduleType, selectedWeek]);

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
            color: params.row.status === 'optimal' 
              ? theme.palette.success.main 
              : params.row.status === 'under'
              ? theme.palette.warning.main
              : theme.palette.error.main,
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
            color: params.value < WORK_STANDARDS.EXPECTED_BREAK - 15
              ? theme.palette.warning.main
              : theme.palette.text.secondary,
          }}
        >
          {params.value}min
          {params.value < WORK_STANDARDS.EXPECTED_BREAK - 15 && ' (Short Break)'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={
            params.value === 'optimal' 
              ? 'Optimal' 
              : params.value === 'under' 
              ? 'Under Hours'
              : 'Over Hours'
          }
          color={
            params.value === 'optimal' 
              ? 'success' 
              : params.value === 'under'
              ? 'warning'
              : 'error'
          }
          variant="outlined"
        />
      ),
    },
  ];

  const totalMinutes = filteredHours.reduce((sum, entry) => sum + entry.totalMinutes, 0);
  const totalHours = Number((totalMinutes / 60).toFixed(2));
  const totalBreakMinutes = filteredHours.reduce((sum, entry) => sum + entry.breakTime, 0);

  // Add weekly hours calculation
  const weeklyHours = filteredHours.reduce((acc, entry) => {
    const week = format(new Date(entry.date), 'w');
    if (!acc[week]) {
      acc[week] = 0;
    }
    acc[week] += entry.hoursWorked;
    return acc;
  }, {} as { [key: string]: number });

  // Helper function to get week options for the selected month
  const getWeekOptions = () => {
    const monthDate = new Date(selectedMonth);
    const weeksInMonth = getWeeksInMonth(monthDate);
    return Array.from({ length: weeksInMonth }, (_, i) => {
      const weekNum = i + 1;
      const weekStart = startOfWeek(new Date(selectedMonth));
      const weekDates = format(addDays(weekStart, i * 7), 'MMM d') + 
                       ' - ' + 
                       format(addDays(weekStart, i * 7 + 6), 'MMM d');
      return {
        value: weekNum.toString(),
        label: `Week ${weekNum} (${weekDates})`
      };
    });
  };

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
            {firebaseUser && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {userName || 'Unknown Agent'}
                </Typography>
              </Stack>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                value={scheduleType}
                label="Schedule Type"
                onChange={(e) => setScheduleType(e.target.value as 'standard' | 'short')}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="standard">Standard (40h)</MenuItem>
                <MenuItem value="short">Short Week (39h)</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedWeek('all'); // Reset week selection when month changes
                }}
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
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Week</InputLabel>
              <Select
                value={selectedWeek}
                label="Week"
                onChange={(e) => setSelectedWeek(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Weeks</MenuItem>
                {getWeekOptions().map((week) => (
                  <MenuItem key={week.value} value={week.value}>
                    {week.label}
                  </MenuItem>
                ))}
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
              onClick={() => {
                setSelectedMonth(format(new Date(), 'yyyy-MM'));
                setSelectedWeek('all');
              }}
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              onClick={() => setOpenSignDialog(true)}
              sx={{
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.success.main, 0.2),
                },
              }}
            >
              <DownloadIcon />
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
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Period
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'medium' }}>
              {selectedWeek === 'all' 
                ? format(new Date(selectedMonth), 'MMMM yyyy')
                : `Week ${selectedWeek}`
              }
            </Typography>
          </Box>
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
            <Typography 
              variant="h6" 
              color={totalBreakMinutes < WORK_STANDARDS.EXPECTED_BREAK ? "warning" : "text.primary"} 
              sx={{ fontWeight: 'medium' }}
            >
              {totalBreakMinutes}min
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Weekly Average
            </Typography>
            <Typography 
              variant="h6" 
              color={Object.values(weeklyHours).some(hours => 
                hours < (scheduleType === 'standard' ? WORK_STANDARDS.STANDARD_SCHEDULE.WEEKLY_HOURS : WORK_STANDARDS.SHORT_SCHEDULE.WEEKLY_HOURS)
              ) ? "warning" : "success"} 
              sx={{ fontWeight: 'medium' }}
            >
              {Object.values(weeklyHours).length > 0 
                ? (Object.values(weeklyHours).reduce((a, b) => a + b, 0) / Object.values(weeklyHours).length).toFixed(1) 
                : 0}h/week
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

      <Dialog 
        open={openSignDialog} 
        onClose={() => setOpenSignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Sign Report
          <Typography variant="body2" color="text.secondary">
            Please sign in the box below
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              mt: 2,
              backgroundColor: '#fff',
              '& canvas': {
                width: '100% !important',
                height: '200px !important'
              }
            }}
          >
            <SignaturePad
              ref={signatureRef}
              options={{
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearSignature} color="inherit">
            Clear
          </Button>
          <Button onClick={() => setOpenSignDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSign} variant="contained" color="primary">
            Confirm & Download
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MonthlyWorkReport;
