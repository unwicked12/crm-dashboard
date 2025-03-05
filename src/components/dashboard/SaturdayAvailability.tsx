import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Switch,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  format, 
  addMonths, 
  subMonths, 
  isSameDay,
  eachWeekendOfMonth,
  isSaturday
} from 'date-fns';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { requestService } from '../../services/requestService';

// Minimalist Saturday availability component
const SaturdayAvailability: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [saturdays, setSaturdays] = useState<Date[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, boolean>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  
  // Default availability
  const [defaultAvailability, setDefaultAvailability] = useState<boolean>(false);
  const [hasSetDefaultBefore, setHasSetDefaultBefore] = useState(false);
  
  // Change request
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newAvailability, setNewAvailability] = useState<boolean>(false);
  const [changeReason, setChangeReason] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Dialog controls
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  // Get Saturdays for the current month
  const getSaturdaysForMonth = useCallback((date: Date) => {
    const allWeekends = eachWeekendOfMonth(date);
    return allWeekends.filter(day => isSaturday(day));
  }, []);
  
  // Fetch user's default Saturday availability
  const fetchDefaultAvailability = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const available = await userService.getUserSaturdayAvailability(user.uid);
      setDefaultAvailability(available);
      
      // Check if user has set availability before
      const history = await userService.getSaturdayAvailabilityHistory(user.uid);
      setHasSetDefaultBefore(history.length > 0);
    } catch (error: any) {
      console.error('Error fetching default Saturday availability:', error);
      // Fallback to default value if there's an index error
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        setDefaultAvailability(false);
      } else {
        setError('Failed to load default availability');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Fetch Saturday availability for the current month
  const fetchSaturdayAvailability = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Get all Saturdays in the current month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed
      const saturdays = userService.getSaturdaysInMonth(month, year);
      
      // Create a new map to store availability for each date
      const newDateAvailability = new Map<string, boolean>();
      
      // Try to get availability for each Saturday
      for (const saturday of saturdays) {
        try {
          const isAvailable = await userService.getUserSaturdayAvailabilityForDate(user.uid, saturday);
          const dateStr = format(saturday, 'yyyy-MM-dd');
          newDateAvailability.set(dateStr, isAvailable);
        } catch (error: any) {
          // If there's an index error, use the default availability
          if (error.code === 'failed-precondition' && error.message.includes('index')) {
            const dateStr = format(saturday, 'yyyy-MM-dd');
            newDateAvailability.set(dateStr, defaultAvailability);
          }
        }
      }
      
      setAvailabilityMap(newDateAvailability);
    } catch (error: any) {
      // Don't show error for index issues
      if (!(error.code === 'failed-precondition' && error.message.includes('index'))) {
        setError('Failed to load availability data');
      }
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth, defaultAvailability]);
  
  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const requests = await requestService.getUserRequests(user.uid);
      setPendingRequests(requests.filter(req => req.status === 'pending' && req.type === 'saturday_availability'));
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
    }
  }, [user]);
  
  // Initialize data
  useEffect(() => {
    if (user?.uid) {
      fetchDefaultAvailability();
      fetchPendingRequests();
    }
  }, [user, fetchDefaultAvailability, fetchPendingRequests]);
  
  // Update saturdays when month changes
  useEffect(() => {
    const newSaturdays = getSaturdaysForMonth(currentMonth);
    setSaturdays(newSaturdays);
  }, [currentMonth, getSaturdaysForMonth]);
  
  // Fetch availability when saturdays change
  useEffect(() => {
    fetchSaturdayAvailability();
  }, [saturdays, fetchSaturdayAvailability]);
  
  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  // Handle default availability change
  const handleDefaultAvailabilityChange = async (newValue: boolean) => {
    if (!user?.uid) return;
    
    if (hasSetDefaultBefore) {
      // If user has set availability before, require approval
      setSelectedDate(null);
      setNewAvailability(newValue);
      setChangeReason('');
      setChangeDialogOpen(true);
    } else {
      // First-time setting doesn't require approval
      try {
        setLoading(true);
        await userService.updateSaturdayAvailability(user.uid, newValue, user.uid);
        setDefaultAvailability(newValue);
        setSuccessMessage(`Default availability updated to ${newValue ? 'available' : 'unavailable'}`);
        setHasSetDefaultBefore(true);
        
        // Refresh data
        await fetchDefaultAvailability();
        await fetchSaturdayAvailability();
      } catch (error: any) {
        console.error('Error updating default availability:', error);
        setError(error.message || 'Failed to update default availability');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Handle date availability change
  const handleDateAvailabilityChange = (date: Date) => {
    if (!user?.uid) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentAvailability = availabilityMap.get(dateStr) ?? defaultAvailability;
    
    // Check if there's already a pending request for this date
    const hasPendingRequest = pendingRequests.some(req => {
      if (req.date) {
        const reqDate = new Date(req.date);
        return isSameDay(reqDate, date);
      }
      return false;
    });
    
    if (hasPendingRequest) {
      setError('You already have a pending request for this date');
      return;
    }
    
    setSelectedDate(date);
    setNewAvailability(!currentAvailability);
    setChangeReason('');
    setChangeDialogOpen(true);
  };
  
  // Submit change request
  const handleSubmitChangeRequest = async () => {
    if (!user?.uid || !changeReason.trim()) return;
    
    try {
      setLoading(true);
      
      if (selectedDate) {
        // Date-specific change
        await requestService.createRequest({
          userId: user.uid,
          agentId: user.uid,
          type: 'saturday_availability',
          date: selectedDate,
          newAvailability,
          reason: changeReason,
          title: `Saturday Availability Change for ${format(selectedDate, 'MMMM d, yyyy')}`,
          description: `Request to change availability to ${newAvailability ? 'available' : 'unavailable'} for ${format(selectedDate, 'MMMM d, yyyy')}`
        });
        
        // Update pending changes map
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const newPendingChanges = new Map(pendingChanges);
        newPendingChanges.set(dateStr, newAvailability);
        setPendingChanges(newPendingChanges);
        
        setSuccessMessage(`Change request submitted for ${format(selectedDate, 'MMMM d, yyyy')}`);
      } else {
        // Default availability change
        await requestService.createRequest({
          userId: user.uid,
          agentId: user.uid,
          type: 'saturday_availability',
          newAvailability,
          reason: changeReason,
          title: 'Default Saturday Availability Change',
          description: `Request to change default availability to ${newAvailability ? 'available' : 'unavailable'}`
        });
        
        setSuccessMessage('Default availability change request submitted');
      }
      
      // Refresh pending requests
      await fetchPendingRequests();
      
      // Close dialog
      setChangeDialogOpen(false);
    } catch (error: any) {
      console.error('Error submitting change request:', error);
      setError(error.message || 'Failed to submit change request');
    } finally {
      setLoading(false);
    }
  };

  // Render history dialog
  const renderHistoryDialog = () => (
    <Dialog 
      open={historyDialogOpen} 
      onClose={() => setHistoryDialogOpen(false)}
      maxWidth="md"
    >
      <DialogTitle>Availability Change History</DialogTitle>
      <DialogContent>
        {history.length === 0 ? (
          <Typography>No history available</Typography>
        ) : (
          <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
            {history.map((item, index) => (
              <Box 
                component="li" 
                key={index} 
                sx={{ 
                  mb: 2, 
                  pb: 2, 
                  borderBottom: index < history.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' 
                }}
              >
                <Typography variant="subtitle2">{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.timestamp ? format(item.timestamp.toDate(), 'PPpp') : 'Unknown date'}
                </Typography>
                <Typography variant="body2">{item.description}</Typography>
                <Typography variant="body2">Reason: {item.reason}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // Render info dialog
  const renderInfoDialog = () => (
    <Dialog 
      open={infoDialogOpen} 
      onClose={() => setInfoDialogOpen(false)}
    >
      <DialogTitle>Saturday Availability Information</DialogTitle>
      <DialogContent>
        <Typography paragraph>
          This feature allows you to set your availability for Saturday shifts.
        </Typography>
        <Typography paragraph>
          <strong>Default Availability:</strong> This is your general availability for all Saturdays.
          If you are generally available or unavailable for Saturday shifts, set this accordingly.
        </Typography>
        <Typography paragraph>
          <strong>Date-specific Availability:</strong> If you need to change your availability for a specific Saturday,
          click on that date in the calendar and submit a change request.
        </Typography>
        <Typography>
          All changes require approval from management. You will be notified when your request is approved or rejected.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 0, m: 0, height: 'auto', minHeight: 'auto' }}>
      {/* Error and success messages */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Main content - Minimalist version */}
      <Box sx={{ p: 0, m: 0, height: 'auto', minHeight: 'auto' }}>
        {/* Default availability toggle */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1,
          height: 'auto'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Default Availability:
            </Typography>
            <Chip
              size="small"
              icon={defaultAvailability ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
              label={defaultAvailability ? "Available" : "Unavailable"}
              color={defaultAvailability ? "success" : "error"}
              sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
            />
          </Box>
          <Box>
            <Switch
              checked={defaultAvailability}
              onChange={(e) => handleDefaultAvailabilityChange(e.target.checked)}
              color={defaultAvailability ? "success" : "error"}
              size="small"
            />
            <IconButton 
              size="small" 
              onClick={() => setHistoryDialogOpen(true)}
              sx={{ ml: 1 }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setInfoDialogOpen(true)}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {pendingRequests.some(req => !req.date && !req.month) && (
          <Alert severity="warning" sx={{ mb: 1, py: 0, fontSize: '0.7rem' }}>
            Pending default availability change request
          </Alert>
        )}
        
        {/* Month navigation and upcoming Saturdays */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1
        }}>
          <IconButton size="small" onClick={handlePreviousMonth} sx={{ p: 0.5 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          
          <Typography variant="body2" fontWeight="medium">
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          
          <IconButton size="small" onClick={handleNextMonth} sx={{ p: 0.5 }}>
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Click on a date to request a change
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Grid container spacing={1}>
            {saturdays.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isAvailable = availabilityMap.get(dateStr) ?? defaultAvailability;
              const hasPendingRequest = pendingRequests.some(req => {
                if (req.date) {
                  const reqDate = new Date(req.date);
                  return isSameDay(reqDate, date);
                }
                return false;
              });
              
              return (
                <Grid item xs={6} sm={4} key={dateStr}>
                  <Box 
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      bgcolor: isAvailable 
                        ? alpha(theme.palette.success.main, 0.05)
                        : alpha(theme.palette.error.main, 0.05),
                      cursor: hasPendingRequest ? 'not-allowed' : 'pointer',
                      '&:hover': {
                        bgcolor: isAvailable 
                          ? alpha(theme.palette.success.main, 0.1)
                          : alpha(theme.palette.error.main, 0.1),
                      }
                    }}
                    onClick={() => !hasPendingRequest && handleDateAvailabilityChange(date)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mr: 0.5, fontSize: '0.75rem' }}>
                        {format(date, 'MMM d')}
                      </Typography>
                      <Chip
                        size="small"
                        icon={isAvailable ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
                        label={isAvailable ? "Available" : "Unavailable"}
                        color={isAvailable ? "success" : "error"}
                        sx={{ 
                          height: 16, 
                          '& .MuiChip-label': { 
                            px: 0.5, 
                            fontSize: '0.65rem' 
                          },
                          '& .MuiChip-icon': {
                            fontSize: '0.65rem',
                            ml: 0.25
                          }
                        }}
                      />
                    </Box>
                    
                    {hasPendingRequest && (
                      <Chip
                        size="small"
                        label="Pending"
                        color="warning"
                        sx={{ 
                          height: 16, 
                          '& .MuiChip-label': { 
                            px: 0.5, 
                            fontSize: '0.65rem' 
                          }
                        }}
                      />
                    )}
                    
                    {!hasPendingRequest && (
                      <IconButton 
                        size="small" 
                        sx={{ p: 0.25 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateAvailabilityChange(date);
                        }}
                      >
                        <EditIcon fontSize="small" sx={{ fontSize: '0.75rem' }} />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Change request dialog */}
      <Dialog open={changeDialogOpen} onClose={() => setChangeDialogOpen(false)}>
        <DialogTitle>
          {selectedDate 
            ? `Change Availability for ${format(selectedDate, 'MMMM d, yyyy')}`
            : 'Change Default Availability'}
        </DialogTitle>
        <DialogContent>
          <Typography paragraph sx={{ mt: 1 }}>
            Change to:
            <Chip
              label={newAvailability ? 'Available' : 'Unavailable'}
              color={newAvailability ? 'success' : 'error'}
              size="small"
              sx={{ ml: 1 }}
            />
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Reason for change"
            fullWidth
            multiline
            rows={3}
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            required
            error={changeReason.trim() === ''}
            helperText={changeReason.trim() === '' ? 'Reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitChangeRequest} 
            variant="contained" 
            disabled={changeReason.trim() === '' || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History dialog */}
      {renderHistoryDialog()}
      
      {/* Info dialog */}
      {renderInfoDialog()}
    </Box>
  );
};

export default SaturdayAvailability; 