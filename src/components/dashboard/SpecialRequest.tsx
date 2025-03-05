import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Event as EventIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { requestService, Request } from '../../services/requestService';

interface SpecialRequest extends Request {
  type: 'special';
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
const SpecialRequest: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Fetch requests on component mount
  useEffect(() => {
    if (!user?.id) return;
    
    fetchRequests(user.id);
    const refreshInterval = setInterval(() => fetchRequests(user.id), 30000);
    return () => clearInterval(refreshInterval);
  }, [user?.id]);

  const fetchRequests = async (userId: string) => {
    try {
      setLoading(true);
      const allRequests = await requestService.getUserRequests(userId);
      const specialRequests = allRequests
        .filter(req => req.type === 'special')
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Sort by creation date, newest first
        }) as SpecialRequest[];
      
      setRequests(specialRequests);
    } catch (error: any) {
      console.error('Error fetching special requests:', error);
      setError(error.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !reason || !user?.id) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Debug log
      console.log('Submitting special request with dates:', {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString() || startDate?.toISOString()
      });
      
      await requestService.createRequest({
        type: 'special',
        startDate,
        endDate: endDate || startDate, // For special requests, end date is optional
        reason,
        userId: user.id,
        // Ensure date field is set to avoid undefined error
        date: startDate
      });

      // Refresh the requests list
      await fetchRequests(user.id);

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setError(null);
    } catch (error: any) {
      console.error('Error submitting special request:', error);
      setError(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
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

  return (
    <Box>
      <Card sx={{ mb: 2, p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="medium">Submit Special Request</Typography>
            
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                disabled={loading}
                sx={{ width: '100%' }}
              />
              <DatePicker
                label="End Date (Optional)"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                disabled={loading}
                sx={{ width: '100%' }}
              />
            </Stack>

            <TextField
              label="Request Details"
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

      {requests.length > 0 && (
        <>
          <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
            Previous Requests
            <Chip 
              label={requests.length} 
              size="small" 
              sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
            />
          </Typography>
          
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
                      {request.startDate && request.endDate && request.endDate !== request.startDate && 
                        ` - ${format(new Date(request.endDate), 'MMM d')}`}
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
        </>
      )}

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

export default SpecialRequest;