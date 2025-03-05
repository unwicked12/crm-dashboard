// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState, useRef, useCallback, ReactElement } from 'react';
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DataGrid, GridColDef } from '@mui/x-data-grid';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format as dateFnsFormat, differenceInMinutes, startOfDay, parseISO, getWeek, addMonths, getWeeksInMonth, addWeeks, addDays, startOfMonth, endOfMonth } from 'date-fns';
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
  getDoc,
  addDoc,
  getDocs,
  type FirestoreDataConverter,
  type DocumentData,
  serverTimestamp,
} from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { QuerySnapshot, QueryDocumentSnapshot } from '@firebase/firestore-types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db } from '../../firebase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '../../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import SignaturePad from 'react-signature-pad-wrapper';

interface ActivityLog {
  type: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  status?: string;
  createdAt?: string;
}

interface FirestoreDoc<T> {
  data(): T;
  id: string;
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
  scheduleType: 'standard' | 'short' | 'nine';
}

interface SignatureData {
  signatureUrl: string;
  date: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    SHORT_DAY_HOURS: 7, // One day per week is shorter
  },
  NINE_SCHEDULE: {
    DAILY_HOURS: 9,
    WEEKLY_HOURS: 9,
    MIN_DAILY_HOURS: 8.5,
    MAX_DAILY_HOURS: 9.5,
  },
  EXPECTED_BREAK: 60, // minutes
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MonthlyWorkReport = (): ReactElement => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workHours, setWorkHours] = useState<DailyWorkHours[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filteredHours, setFilteredHours] = useState<DailyWorkHours[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedMonth, setSelectedMonth] = useState<string>(dateFnsFormat(new Date(), 'yyyy-MM'));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scheduleType, setScheduleType] = useState<'standard' | 'short' | 'nine'>('standard');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userName, setUserName] = useState<string>('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [openSignDialog, setOpenSignDialog] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [signature, setSignature] = useState<SignatureData | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signatureRef = useRef<SignaturePad>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAdmin, setIsAdmin] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userData, setUserData] = useState<any>(null);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData);
        setUserName(userData.name || userData.displayName || 'Unknown Agent');
        setScheduleType(userData.scheduleType || 'standard');
        setIsAdmin(userData.role === 'admin');
      }
    };

    fetchUserData();
  }, [user]);

  const format = (date: Date | number | string, formatStr: string): string => {
    if (typeof date === 'string') {
      return dateFnsFormat(parseISO(date), formatStr);
    }
    return dateFnsFormat(date, formatStr);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addTimeToDate = (date: Date, type: 'months' | 'weeks' | 'days', amount: number): Date => {
    switch (type) {
      case 'months':
        return addMonths(date, amount);
      case 'weeks':
        return addWeeks(date, amount);
      case 'days':
        return addDays(date, amount);
      default:
        return date;
    }
  };

  const handleDateFormat = (date: Date | string): Date => {
    if (typeof date === 'string') {
      return parseISO(date);
    }
    return date;
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterByMonth = (data: DailyWorkHours[], month: string, weekFilter: string) => {
    const monthDate = parseISO(month);
    const start = startOfDay(monthDate);
    const end = addMonths(start, 1);
    
    return data.filter(entry => {
      const date = handleDateFormat(entry.date);
      if (weekFilter === 'all') {
        return date >= start && date < end;
      } else {
        const weekNum = Number(weekFilter);
        const entryWeek = getWeek(date);
        return entryWeek === weekNum && date >= start && date < end;
      }
    });
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getWorkStatus = useCallback((hoursWorked: number, breakTime: number): 'under' | 'over' | 'optimal' => {
    let schedule;
    switch (scheduleType) {
      case 'short':
        schedule = WORK_STANDARDS.SHORT_SCHEDULE;
        // For the short schedule, one day per week can be 7 hours
        const isShortDay = hoursWorked >= schedule.SHORT_DAY_HOURS - 0.5 && 
                          hoursWorked <= schedule.SHORT_DAY_HOURS + 0.5;
        if (isShortDay) return 'optimal';
        break;
      case 'nine':
        schedule = WORK_STANDARDS.NINE_SCHEDULE;
        break;
      default:
        schedule = WORK_STANDARDS.STANDARD_SCHEDULE;
    }
    
    if (breakTime < WORK_STANDARDS.EXPECTED_BREAK - 15) return 'under'; // Break too short
    if (hoursWorked < schedule.MIN_DAILY_HOURS) return 'under';
    if (hoursWorked > schedule.MAX_DAILY_HOURS) return 'over';
    return 'optimal';
  }, [scheduleType]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateDayMinutes = (logs: ActivityLog[]): { totalMinutes: number; breakMinutes: number } => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    let totalMinutes = 0;
          let breakMinutes = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
          let lastCheckIn: Date | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
          let breakStartTime: Date | null = null;

    // Sort logs by timestamp to ensure correct order
    const sortedLogs = [...logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    sortedLogs.forEach((log, index) => {
      const timestamp = log.timestamp;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please sign the document before generating the PDF.');
      return;
    }

    try {
      // Get signature with lower quality to reduce size
      const signatureData = signatureRef.current.toDataURL('image/jpeg', 0.5);
      
      // Create the signature data object
      const newSignature = {
        signatureUrl: signatureData,
        date: format(new Date(), 'dd/MM/yyyy HH:mm')
      };

      // Set signature state and wait for it to be updated
      await new Promise<void>((resolve) => {
        setSignature(newSignature);
        // Use setTimeout to ensure state is updated
        setTimeout(resolve, 0);
      });

      // Close dialog and wait for it to be updated
      await new Promise<void>((resolve) => {
        setOpenSignDialog(false);
        setTimeout(resolve, 0);
      });
      
      // Generate PDF with the signature
      await generatePDF();

    } catch (error) {
      console.error('Error processing signature:', error);
      alert('Error with signature. Please try again.');
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getScheduleTypeLabel = (type: 'standard' | 'short' | 'nine'): string => {
    switch (type) {
      case 'short':
        return '39 heures';
      case 'nine':
        return '9 heures';
      default:
        return '40 heures';
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generatePDF = async () => {
    if (!signature) {
      alert('Please sign the document before generating the PDF.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Fiche de présence', pageWidth / 2, 20, { align: 'center' });

      // Add agent details
      doc.setFontSize(11);
      doc.text(`Nom de l'Agent: ${userName}`, 20, 40);
      doc.text(`Période: ${format(new Date(selectedMonth), 'MMMM yyyy')}`, 20, 50);
      doc.text(`Type d'horaire: ${getScheduleTypeLabel(scheduleType)}`, 20, 60);

      // Add activity table with optimized settings
      const tableData = filteredHours.map(day => [
        format(new Date(day.date), 'dd/MM/yyyy'),
        day.checkInTime || '-',
        day.checkOutTime || '-',
        day.hoursWorked.toFixed(2),
        (day.breakTime / 60).toFixed(2),
        day.status === 'optimal' ? 'Optimal' : day.status === 'under' ? 'Insuffisant' : 'Excès'
      ]);

      (doc as any).autoTable({
        startY: 70,
        head: [['Date', 'Arrivée', 'Départ', 'Heures', 'Pause', 'Statut']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1,
          overflow: 'linebreak',
          halign: 'center'
        },
        headStyles: {
          fillColor: [25, 33, 57],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          cellPadding: 1
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 15 },
          2: { cellWidth: 15 },
          3: { cellWidth: 12 },
          4: { cellWidth: 12 },
          5: { cellWidth: 15 }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 200;
      const signatureY = finalY + 20;

      // Add signature section with optimized image
      doc.setFontSize(11);
      doc.text('Signature', 20, signatureY);
      doc.addImage(
        signature.signatureUrl,
        'JPEG',
        20,
        signatureY + 5,
        50, // Reduced width
        20  // Reduced height
      );

      // Add agent name and date
      doc.setFontSize(10);
      doc.text(userName || 'Agent Inconnu', 20, signatureY + 30);
      doc.setFontSize(8);
      doc.text(`Date: ${signature.date}`, 20, signatureY + 35);

      // Generate file name
      const monthName = format(new Date(selectedMonth), 'MMMM-yyyy').toLowerCase();
      const sanitizedAgentName = userName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${sanitizedAgentName}-${monthName}.pdf`;

      // Get base64 with compression
      const pdfBase64 = doc.output('datauri', { filename: fileName });

      // Save document to Firestore with optimized data
      const documentData = {
        userId: user?.id,
        agentId: user?.id,
        agentName: userName,
        documentData: pdfBase64,
        month: format(new Date(selectedMonth), 'MMMM'),
        year: format(new Date(selectedMonth), 'yyyy'),
        uploadedAt: Timestamp.fromDate(new Date()),
        fileName: fileName,
        type: 'signed_document',
        status: 'active',
        createdBy: user?.id,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Save to Firestore
      await addDoc(collection(db, 'signedDocuments'), documentData);
      
      // Save locally
      doc.save(fileName);
      
      alert('Document signed and saved successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error saving the document. Please try again.');
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user?.id) return;

    const monthStart = startOfDay(new Date(selectedMonth));
    const monthEnd = startOfDay(addMonths(new Date(selectedMonth), 1));

    const logsQuery = query(
      collection(db, 'activityLogs'),
      where('userId', '==', user.id),
      where('timestamp', '>=', Timestamp.fromDate(monthStart)),
      where('timestamp', '<=', Timestamp.fromDate(monthEnd)),
      orderBy('timestamp', 'asc')
    );

// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unsubscribe = onSnapshot(logsQuery, (snapshot: QuerySnapshot) => {
      try {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
        const logs: ActivityLog[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          let timestamp: Date;
          
          if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp instanceof Date) {
            timestamp = data.timestamp;
          } else {
            timestamp = new Date(data.createdAt || Date.now());
          }

          return {
            type: data.status || 'checked-out',
            timestamp,
            userId: data.userId,
            userName: data.userName,
            status: data.status,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
        const dailyWorkHours: DailyWorkHours[] = Object.entries(dailyLogs).map(([date, logs]) => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        setFilteredHours(filterByMonth(dailyWorkHours, selectedMonth, selectedWeek));
      } catch (error) {
        console.error('Error processing logs:', error);
      }
    });

    return () => unsubscribe();
  }, [selectedMonth, selectedWeek]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />
          <Typography variant="body2">
            {format(params.value, 'dd/MM/yyyy')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'checkInTime',
      headerName: 'Arrivée',
      width: 100,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          icon={<TimeIcon sx={{ fontSize: 16 }} />}
          sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.dark,
            height: 24,
          }}
        />
      ),
    },
    {
      field: 'checkOutTime',
      headerName: 'Départ',
      width: 100,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          icon={<TimeIcon sx={{ fontSize: 16 }} />}
          sx={{
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.dark,
            height: 24,
          }}
        />
      ),
    },
    {
      field: 'hoursWorked',
      headerName: 'Heures',
      width: 80,
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
      headerName: 'Pause',
      width: 90,
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
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 100,
      renderCell: (params) => (
        <Chip
          size="small"
          label={
            params.value === 'optimal' 
              ? 'Optimal' 
              : params.value === 'under' 
              ? 'Insuffisant'
              : 'Excès'
          }
          color={
            params.value === 'optimal' 
              ? 'success' 
              : params.value === 'under'
              ? 'warning'
              : 'error'
          }
          variant="outlined"
          sx={{ height: 24 }}
        />
      ),
    },
  ];

  const totalMinutes = filteredHours.reduce((sum, entry) => sum + entry.totalMinutes, 0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalHours = Number((totalMinutes / 60).toFixed(2));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalBreakMinutes = filteredHours.reduce((sum, entry) => sum + entry.breakTime, 0);

  // Add weekly hours calculation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const weeklyHours = filteredHours.reduce((acc, entry) => {
    const week = format(new Date(entry.date), 'w');
    if (!acc[week]) {
      acc[week] = 0;
    }
    acc[week] += entry.hoursWorked;
    return acc;
  }, {} as { [key: string]: number });

  // Helper function to get week options for the selected month
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getWeekOptions = () => {
    const monthDate = parseISO(selectedMonth);
    const weeksCount = getWeeksInMonth(monthDate);
    return Array.from({ length: weeksCount }, (_, i) => {
      const weekNum = i + 1;
      const weekStart = addWeeks(monthDate, i);
      const weekEnd = addDays(weekStart, 6);
      const weekDates = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
      return {
        value: weekNum.toString(),
        label: `Week ${weekNum} (${weekDates})`
      };
    });
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (values: FormData) => {
    if (!user?.id) return;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reportData = {
      ...values,
      userId: user.id,
      agentId: user.id,
      timestamp: serverTimestamp(),
      createdBy: user.id,
    };

    // ... existing code ...
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchReports = async () => {
    if (!user?.id) return;

    const reportsRef = collection(db, 'reports');
    const monthDate = new Date(selectedMonth);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const q = query(
      reportsRef,
      where('userId', '==', user.id),
      where('timestamp', '>=', startOfMonth(monthDate)),
      where('timestamp', '<=', endOfMonth(monthDate)),
      orderBy('timestamp', 'desc')
    );

    // ... existing code ...
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2,
        borderRadius: 2,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Attendance
            </Typography>
            {user && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {userName || 'Unknown Agent'}
                </Typography>
              </Stack>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {isAdmin ? (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type d'horaire</InputLabel>
                <Select
                  value={scheduleType}
                  label="Type d'horaire"
                  onChange={(e) => setScheduleType(e.target.value as 'standard' | 'short' | 'nine')}
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="standard">40 heures par semaine</MenuItem>
                  <MenuItem value="short">39 heures par semaine (1 journée courte)</MenuItem>
                  <MenuItem value="nine">9 heures par semaine</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Chip
                label={scheduleType === 'standard' ? '40 heures par semaine' : 
                      scheduleType === 'short' ? '39 heures par semaine (1 journée courte)' : 
                      '9 heures par semaine'}
                size="small"
                sx={{ 
                  height: 32,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '& .MuiChip-label': { px: 1.5 }
                }}
              />
            )}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Mois</InputLabel>
              <Select
                value={selectedMonth}
                label="Mois"
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedWeek('all');
                }}
                sx={{ borderRadius: 1 }}
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Semaine</InputLabel>
              <Select
                value={selectedWeek}
                label="Semaine"
                onChange={(e) => setSelectedWeek(e.target.value)}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="all">Toutes les semaines</MenuItem>
                {getWeekOptions().map((week) => (
                  <MenuItem key={week.value} value={week.value}>
                    Semaine {week.value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
              onClick={() => {
                setSelectedMonth(format(new Date(), 'yyyy-MM'));
                setSelectedWeek('all');
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setOpenSignDialog(true)}
              sx={{
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.success.main, 0.2),
                },
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            p: 1.5,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Période
            </Typography>
            <Typography variant="subtitle2" color="primary">
              {selectedWeek === 'all' 
                ? format(new Date(selectedMonth), 'MMMM yyyy')
                : `Semaine ${selectedWeek}`
              }
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Heures totales
            </Typography>
            <Typography variant="subtitle2" color="primary">
              {totalHours}h
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Pauses totales
            </Typography>
            <Typography 
              variant="subtitle2" 
              color={totalBreakMinutes < WORK_STANDARDS.EXPECTED_BREAK ? "warning" : "text.primary"}
            >
              {totalBreakMinutes}min
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Moyenne hebdomadaire
            </Typography>
            <Typography 
              variant="subtitle2" 
              color={Object.values(weeklyHours).some(hours => 
                hours < (scheduleType === 'standard' ? WORK_STANDARDS.STANDARD_SCHEDULE.WEEKLY_HOURS : WORK_STANDARDS.SHORT_SCHEDULE.WEEKLY_HOURS)
              ) ? "warning" : "success"}
            >
              {Object.values(weeklyHours).length > 0 
                ? (Object.values(weeklyHours).reduce((a, b) => a + b, 0) / Object.values(weeklyHours).length).toFixed(1) 
                : 0}h/semaine
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
            borderRadius: 1,
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-cell': {
            borderColor: theme.palette.divider,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: '4px 4px 0 0',
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
              paginationModel: { page: 0, pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 20, 30]}
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