// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Stack,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Divider,
  useTheme,
  alpha,
  IconButton,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format, parseISO, isAfter, isBefore, isEqual } from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { requestService, Request } from '../../services/requestService';
import { useAuth } from '../../contexts/AuthContext';

// Holiday request type
type HolidayRequest = Request & {
  type: 'holiday';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LeaveManagement: React.FC = () => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [requests, setRequests] = useState<HolidayRequest[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filteredRequests, setFilteredRequests] = useState<HolidayRequest[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expanded, setExpanded] = useState<string | false>(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statusFilter, setStatusFilter] = useState<string>('all');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dateFilter, setDateFilter] = useState<[Date | null, Date | null]>([null, null]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    requestId: string | null;
    action: 'approved' | 'rejected' | null;
  }>({
    open: false,
    requestId: null,
    action: null,
  });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all holiday requests
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      // Removed console.log
      
      // Use the new optimized method for holiday requests
      let data;
      if (statusFilter !== 'all') {
        data = await requestService.getHolidayRequests(statusFilter as 'pending' | 'approved' | 'rejected');
      } else {
        data = await requestService.getHolidayRequests();
      }
      
      // Removed console.log
      
      // Process dates and ensure all requests are of type 'holiday'
      const processedRequests = data
        .filter(req => req.type === 'holiday')
        .map(request => ({
          ...request,
          type: 'holiday' as const, // Ensure type is strictly 'holiday'
          startDate: request.startDate ? (request.startDate instanceof Date ? request.startDate : new Date(request.startDate)) : undefined,
          endDate: request.endDate ? (request.endDate instanceof Date ? request.endDate : new Date(request.endDate)) : undefined,
          createdAt: request.createdAt instanceof Date ? request.createdAt : new Date(request.createdAt || Date.now())
        })) as HolidayRequest[];
      
      setRequests(processedRequests);
      setFilteredRequests(processedRequests);
    } catch (error: any) {
      console.error('Error fetching holiday requests:', error);
      setError(error.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.uid) {
      fetchRequests();
    }
  }, [user, statusFilter]);

  // Apply filters
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let result = [...requests];
    
    // Status filter is now applied at the database level
    
    // Apply date filter
    if (dateFilter[0] && dateFilter[1]) {
      result = result.filter(request => {
        // Skip requests without valid dates
        if (!request.startDate || !request.endDate) return false;
        
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        const filterStart = dateFilter[0] as Date;
        const filterEnd = dateFilter[1] as Date;
        
        // Check if request date range overlaps with filter date range
        return (
          (isAfter(requestStart, filterStart) || isEqual(requestStart, filterStart)) &&
          (isBefore(requestEnd, filterEnd) || isEqual(requestEnd, filterEnd))
        );
      });
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(request => 
        request.reason.toLowerCase().includes(query) ||
        request.userId.toLowerCase().includes(query)
      );
    }
    
    setFilteredRequests(result);
  }, [requests, statusFilter, dateFilter, searchQuery]);

  // Handle accordion expansion
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAccordionChange = (requestId: string) => {
    setExpanded(expanded === requestId ? false : requestId);
  };

  // Handle request status update
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      await requestService.updateRequestStatus(requestId, status);
      await fetchRequests();
      setSuccessMessage(`Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      console.error(`Error ${status} request:`, error);
      setError(error.message || `Failed to ${status} request`);
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, requestId: null, action: null });
    }
  };

  // Open confirmation dialog
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openConfirmDialog = (requestId: string, action: 'approved' | 'rejected') => {
    setConfirmDialog({
      open: true,
      requestId,
      action,
    });
  };

  // Close confirmation dialog
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      requestId: null,
      action: null,
    });
  };

  // Handle confirmation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConfirm = () => {
    if (confirmDialog.requestId && confirmDialog.action) {
      handleUpdateStatus(confirmDialog.requestId, confirmDialog.action);
    }
  };

  // Reset filters
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetFilters = () => {
    setStatusFilter('all');
    setDateFilter([null, null]);
    setSearchQuery('');
    // Refetch requests with the new status filter
    fetchRequests();
  };

  // Calculate leave duration in days
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateDuration = (startDate: Date, endDate: Date): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays;
  };

  // Get status color
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  // Get status background color
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return alpha(theme.palette.success.main, 0.1);
      case 'rejected':
        return alpha(theme.palette.error.main, 0.1);
      case 'pending':
      default:
        return alpha(theme.palette.warning.main, 0.1);
    }
  };

  return (
    <Box>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Typography variant="h5" gutterBottom>
        Leave Management
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="From Date"
              value={dateFilter[0]}
              onChange={(date) => setDateFilter([date, dateFilter[1]])}
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="To Date"
              value={dateFilter[1]}
              onChange={(date) => setDateFilter([dateFilter[0], date])}
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={resetFilters}
              startIcon={<FilterIcon />}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography>Loading requests...</Typography>
        </Box>
      )}

      {/* No requests found */}
      {!loading && filteredRequests.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'divider',
            mb: 4,
          }}
        >
          <Typography color="text.secondary">
            No holiday requests found matching your filters
          </Typography>
          {(statusFilter !== 'all' || dateFilter[0] || dateFilter[1] || searchQuery) && (
            <Button
              variant="text"
              onClick={resetFilters}
              sx={{ mt: 1 }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      )}

      {/* Requests list */}
      {!loading && filteredRequests.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Holiday Requests ({filteredRequests.length})
          </Typography>
          {filteredRequests.map((request) => (
            <Accordion
              key={request.id}
              expanded={expanded === request.id}
              onChange={() => request.id && handleAccordionChange(request.id)}
              sx={{
                mb: 1,
                backgroundColor: getStatusBgColor(request.status),
                '&:before': {
                  display: 'none',
                },
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={2} alignItems="center" width="100%">
                  <EventIcon color="action" />
                  <Box flex={1}>
                    <Typography>
                      {request.startDate && format(new Date(request.startDate), 'PP')}
                      {request.startDate && request.endDate && ' - '}
                      {request.endDate && format(new Date(request.endDate), 'PP')}
                      {' '}
                      <Typography component="span" variant="body2" color="text.secondary">
                        {request.startDate && request.endDate && 
                          `(${calculateDuration(new Date(request.startDate), new Date(request.endDate))} days)`}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      User ID: {request.userId}
                    </Typography>
                  </Box>
                  <Chip
                    label={request.status}
                    color={getStatusColor(request.status) as any}
                    size="small"
                  />
                  {request.status === 'pending' && (
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          request.id && openConfirmDialog(request.id, 'approved');
                        }}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          request.id && openConfirmDialog(request.id, 'rejected');
                        }}
                      >
                        <RejectIcon />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle2">Reason:</Typography>
                <Typography paragraph whiteSpace="pre-line">
                  {request.reason}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Submitted on: {format(new Date(request.createdAt || new Date()), 'PPpp')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                    {request.status === 'pending' && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => request.id && openConfirmDialog(request.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => request.id && openConfirmDialog(request.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
      >
        <DialogTitle>
          {confirmDialog.action === 'approved' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {confirmDialog.action === 'approved' ? 'approve' : 'reject'} this holiday request?
            {confirmDialog.action === 'rejected' && ' This will notify the employee that their request has been rejected.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            color={confirmDialog.action === 'approved' ? 'success' : 'error'}
            variant="contained"
            disabled={loading}
          >
            {confirmDialog.action === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagement;