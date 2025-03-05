import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
  alpha,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  DialogContentText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  PendingActions as PendingIcon,
  Schedule as UpcomingIcon,
  History as HistoryIcon,
  HourglassEmpty as HourglassEmptyIcon,
  EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, isFuture, isPast, isToday } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { requestService, Request } from '../../services/requestService';
import { userService } from '../../services/userService';

// Remove duplicate interface definition and rename to avoid conflict
type HolidayRequestType = Request & {
  type: 'holiday';
};

const HolidayRequest: React.FC = () => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [expanded, setExpanded] = useState<string | false>(false);
  const [requests, setRequests] = useState<HolidayRequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saturdayAvailability, setSaturdayAvailability] = useState<boolean>(false);
  const [saturdayAvailabilityHistory, setSaturdayAvailabilityHistory] = useState<any[]>([]);
  const { user } = useAuth();

  const fetchRequests = async (userId: string) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log('Fetching requests for user:', userId);
      const data = await requestService.getUserRequests(userId);
      console.log('Raw request data:', data);
      const holidayRequests = data.filter((req) => req.type === 'holiday') as HolidayRequestType[];
      console.log('Filtered holiday requests:', holidayRequests);
      
      const processedRequests = holidayRequests.map(request => ({
        ...request,
        startDate: request.startDate ? (request.startDate instanceof Date ? request.startDate : new Date(request.startDate)) : undefined,
        endDate: request.endDate ? (request.endDate instanceof Date ? request.endDate : new Date(request.endDate)) : undefined,
        createdAt: request.createdAt instanceof Date ? request.createdAt : new Date(request.createdAt || Date.now())
      }));
      
      console.log('Processed requests:', processedRequests);
      setRequests(processedRequests);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching holiday requests:', error);
      setError(error.message || 'Failed to fetch requests');
      setRequests([]); // Clear requests on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's Saturday availability
  const fetchSaturdayAvailability = async (userId: string) => {
    try {
      const available = await userService.getUserSaturdayAvailability(userId);
      setSaturdayAvailability(available);
      
      // Also fetch history
      const history = await userService.getSaturdayAvailabilityHistory(userId);
      setSaturdayAvailabilityHistory(history);
    } catch (error: any) {
      console.error('Error fetching Saturday availability:', error);
    }
  };

  useEffect(() => {
    console.log('HolidayRequest component mounted, user:', user);
    if (!user?.uid) {
      console.log('No user ID available');
      return;
    }
    
    fetchRequests(user.uid);
    fetchSaturdayAvailability(user.uid);
    
    const refreshInterval = setInterval(() => {
      if (user?.uid) {
        fetchRequests(user.uid);
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason || !user?.uid) {
      setError('Please fill in all required fields');
      return;
    }

    if (startDate > endDate) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Debug log
      console.log('Submitting holiday request with dates:', {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });
      
      await requestService.createRequest({
        type: 'holiday',
        startDate,
        endDate,
        reason,
        userId: user.uid,
        // Ensure date field is set to avoid undefined error
        date: startDate
      });

      // Show success message
      setSuccessMessage('Holiday request submitted successfully');

      // Refresh the requests list
      await fetchRequests(user.uid);

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setError(null);
    } catch (error: any) {
      console.error('Error submitting holiday request:', error);
      setError(error.message || 'Failed to submit holiday request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (requestId: string) => {
    setExpanded(expanded === requestId ? false : requestId);
  };

  const handleDeleteClick = (requestId: string) => {
    setSelectedRequest(requestId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRequest || !user?.id) return;

    try {
      setLoading(true);
      await requestService.deleteRequest(selectedRequest);
      await fetchRequests(user.id);
      setDeleteDialogOpen(false);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Error deleting request:', error);
      setError(error.message || 'Failed to delete request');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests by status and date
  const getPendingRequests = () => {
    return requests.filter(request => request.status === 'pending');
  };

  const getUpcomingRequests = () => {
    return requests.filter(request => 
      request.status === 'approved' && request.startDate && 
      (isFuture(new Date(request.startDate)) || isToday(new Date(request.startDate)))
    );
  };

  const getPastRequests = () => {
    return requests.filter(request => 
      (request.status === 'approved' && request.endDate && isPast(new Date(request.endDate))) ||
      request.status === 'rejected'
    );
  };

  const renderRequestSection = (title: string, icon: JSX.Element, requests: HolidayRequestType[]) => {
    if (requests.length === 0) {
      return null; // Don't render empty sections
    }
    
    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {icon}
          <Typography variant="subtitle1" fontWeight="medium">{title}</Typography>
          <Chip 
            label={requests.length} 
            size="small" 
            sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
          />
        </Stack>
        <Box sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          {requests.map((request) => (
            <Box
              key={request.id}
              sx={{
                p: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none'
                },
                backgroundColor: 
                  request.status === 'approved' 
                    ? alpha(theme.palette.success.main, 0.05)
                    : request.status === 'rejected'
                    ? alpha(theme.palette.error.main, 0.05)
                    : alpha(theme.palette.warning.main, 0.05),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {request.startDate && format(new Date(request.startDate), 'MMM d')}
                    {request.startDate && request.endDate && ' - '}
                    {request.endDate && format(new Date(request.endDate), 'MMM d')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                    {request.reason.substring(0, 30)}
                    {request.reason.length > 30 ? '...' : ''}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={request.status}
                  color={
                    request.status === 'approved'
                      ? 'success'
                      : request.status === 'rejected'
                      ? 'error'
                      : 'warning'
                  }
                  size="small"
                  sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                />
                <IconButton
                  size="small"
                  onClick={() => request.id && handleDeleteClick(request.id)}
                  sx={{ ml: 0.5 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Handle Saturday availability change
  const handleSaturdayAvailabilityChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.uid) return;
    
    const newAvailability = event.target.checked;
    setSaturdayAvailability(newAvailability);
    
    try {
      setLoading(true);
      await userService.updateSaturdayAvailability(user.uid, newAvailability, user.uid);
      setSuccessMessage(`Saturday availability updated to ${newAvailability ? 'available' : 'unavailable'}`);
      
      // Refresh history
      const history = await userService.getSaturdayAvailabilityHistory(user.uid);
      setSaturdayAvailabilityHistory(history);
    } catch (error: any) {
      console.error('Error updating Saturday availability:', error);
      setError(error.message || 'Failed to update Saturday availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />

      <Card sx={{ mb: 2, p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="medium">Submit Holiday Request</Typography>
            
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                disabled={loading}
                sx={{ width: '100%' }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                disabled={loading}
                sx={{ width: '100%' }}
              />
            </Stack>

            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={2}
              required
              disabled={loading}
            />

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            {successMessage && (
              <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                {successMessage}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<EventIcon />}
              size="small"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Stack>
        </form>
      </Card>

      {/* Render request sections only if they have items */}
      {renderRequestSection('Pending Requests', <HourglassEmptyIcon color="warning" fontSize="small" />, getPendingRequests())}
      {renderRequestSection('Upcoming Holidays', <EventAvailableIcon color="success" fontSize="small" />, getUpcomingRequests())}
      {renderRequestSection('Past Requests', <HistoryIcon color="action" fontSize="small" />, getPastRequests())}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HolidayRequest;
