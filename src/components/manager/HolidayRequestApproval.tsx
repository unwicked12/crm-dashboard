import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { requestService, Request } from '../../services/requestService';
import { userService, User } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`holiday-approval-tabpanel-${index}`}
      aria-labelledby={`holiday-approval-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

type HolidayRequest = Request & {
  type: 'holiday';
  userName?: string;
  duration?: number;
  approverId?: string;
};

const HolidayRequestApproval: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<HolidayRequest[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HolidayRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all holiday requests
      const allRequests = await requestService.getHolidayRequests();
      
      // Filter for holiday requests only
      const holidayRequests = allRequests.filter(
        req => req.type === 'holiday'
      ) as HolidayRequest[];
      
      // Get all users to display names
      const allUsers = await userService.getAllUsers();
      const usersMap: Record<string, User> = {};
      allUsers.forEach(user => {
        usersMap[user.id] = user;
      });
      
      // Add user names to requests
      const requestsWithNames = holidayRequests.map(request => ({
        ...request,
        userName: usersMap[request.userId]?.name || 'Unknown User'
      }));
      
      setRequests(requestsWithNames);
      setUsers(usersMap);
    } catch (err) {
      console.error('Error fetching holiday requests:', err);
      setError('Failed to load holiday requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleActionClick = (request: HolidayRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setActionReason('');
    setActionDialogOpen(true);
  };

  const handleActionDialogClose = () => {
    setActionDialogOpen(false);
    setSelectedRequest(null);
    setActionType(null);
    setActionReason('');
    setActionSuccess(null);
    setActionError(null);
  };

  const handleActionConfirm = async () => {
    if (!selectedRequest || !actionType || !user) return;
    
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    
    try {
      if (actionType === 'approve') {
        await requestService.updateRequestStatus(selectedRequest.id!, 'approved');
        setActionSuccess(`Holiday request approved successfully.`);
      } else {
        await requestService.updateRequestStatus(selectedRequest.id!, 'rejected');
        setActionSuccess(`Holiday request rejected successfully.`);
      }
      
      // Refresh the requests list
      fetchRequests();
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        handleActionDialogClose();
      }, 1500);
    } catch (err) {
      console.error(`Error ${actionType}ing request:`, err);
      setActionError(`Failed to ${actionType} request. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending');
  };

  const getApprovedRequests = () => {
    return requests.filter(req => req.status === 'approved');
  };

  const getRejectedRequests = () => {
    return requests.filter(req => req.status === 'rejected');
  };

  const renderRequestsTable = (filteredRequests: HolidayRequest[]) => {
    if (filteredRequests.length === 0) {
      return (
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" color="text.secondary" align="center">
            No holiday requests found.
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.userName}</TableCell>
                <TableCell>
                  {request.startDate ? format(new Date(request.startDate), 'MMM dd, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {request.endDate ? format(new Date(request.endDate), 'MMM dd, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>{request.duration || 'N/A'} days</TableCell>
                <TableCell>{request.reason}</TableCell>
                <TableCell>
                  <Chip
                    label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    color={
                      request.status === 'approved'
                        ? 'success'
                        : request.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleActionClick(request, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleActionClick(request, 'reject')}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                  {request.status !== 'pending' && (
                    <Typography variant="body2" color="text.secondary">
                      {request.status === 'approved' ? 'Approved by ' : 'Rejected by '}
                      {users[request.approverId || '']?.name || 'Unknown'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Holiday Request Management
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="holiday requests tabs">
          <Tab 
            label={`Pending (${getPendingRequests().length})`} 
            id="holiday-approval-tab-0" 
            aria-controls="holiday-approval-tabpanel-0" 
          />
          <Tab 
            label={`Approved (${getApprovedRequests().length})`} 
            id="holiday-approval-tab-1" 
            aria-controls="holiday-approval-tabpanel-1" 
          />
          <Tab 
            label={`Rejected (${getRejectedRequests().length})`} 
            id="holiday-approval-tab-2" 
            aria-controls="holiday-approval-tabpanel-2" 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderRequestsTable(getPendingRequests())}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderRequestsTable(getApprovedRequests())}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderRequestsTable(getRejectedRequests())}
      </TabPanel>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={handleActionDialogClose}>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Holiday Request' : 'Reject Holiday Request'}
        </DialogTitle>
        <DialogContent>
          {actionSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              {actionSuccess}
            </Alert>
          ) : actionError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          ) : (
            <>
              <DialogContentText>
                {actionType === 'approve'
                  ? 'Are you sure you want to approve this holiday request?'
                  : 'Are you sure you want to reject this holiday request?'}
              </DialogContentText>
              {selectedRequest && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Employee:</strong> {selectedRequest.userName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Period:</strong>{' '}
                    {selectedRequest.startDate ? format(new Date(selectedRequest.startDate), 'MMM dd, yyyy') : 'N/A'} to{' '}
                    {selectedRequest.endDate ? format(new Date(selectedRequest.endDate), 'MMM dd, yyyy') : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {selectedRequest.duration || 'N/A'} days
                  </Typography>
                  <Typography variant="body2">
                    <strong>Reason:</strong> {selectedRequest.reason}
                  </Typography>
                </Box>
              )}
              <TextField
                autoFocus
                margin="dense"
                id="reason"
                label={actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                type="text"
                fullWidth
                multiline
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                required={actionType === 'reject'}
              />
            </>
          )}
        </DialogContent>
        {!actionSuccess && (
          <DialogActions>
            <Button onClick={handleActionDialogClose} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleActionConfirm}
              color={actionType === 'approve' ? 'success' : 'error'}
              disabled={actionLoading || (actionType === 'reject' && !actionReason)}
              startIcon={actionLoading ? <CircularProgress size={20} /> : null}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default HolidayRequestApproval; 