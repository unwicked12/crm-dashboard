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
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Event as EventIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { requestService, Request } from '../../services/requestService';

// Type for special requests
type SpecialRequestType = Request & {
  type: 'special';
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
const SpecialRequest: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<SpecialRequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRequests = async (userId: string) => {
    try {
      setLoading(true);
      const data = await requestService.getUserRequests(userId);
      const specialRequests = data.filter((req) => req.type === 'special') as SpecialRequestType[];
      setRequests(specialRequests);
    } catch (error: any) {
      console.error('Error fetching special requests:', error);
      setError(error.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRequests(user.id);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    
    if (!reason) {
      setError('Reason is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Create the special request
      await requestService.createRequest({
        type: 'special',
        startDate,
        endDate: endDate || startDate, // For special requests, end date is optional
        reason,
        status: 'pending'
      });
      
      // Reset form
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setError(null);
      setSuccessMessage('Special request submitted successfully');
      
      // Refresh requests
      if (user?.id) {
        await fetchRequests(user.id);
      }
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
            <Typography variant="subtitle1" fontWeight="medium">Submit Special Request</Typography>
            
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
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
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={2}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="small"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Stack>
        </form>
      </Card>

      {requests.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
            Your Special Requests
          </Typography>
          <Stack spacing={2}>
            {requests.map((request) => (
              <Card key={request.id} sx={{ p: 2 }}>
                <Typography variant="subtitle2">{request.reason}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {request.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dates: {request.startDate?.toLocaleDateString()} 
                  {request.endDate && ` - ${request.endDate.toLocaleDateString()}`}
                </Typography>
              </Card>
            ))}
          </Stack>
        </Box>
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