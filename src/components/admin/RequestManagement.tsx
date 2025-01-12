import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { requestService, Request } from '../../services/requestService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';

interface UserInfo {
  name: string;
  email: string;
}

interface EnrichedRequest extends Request {
  userInfo?: UserInfo;
}

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrichedRequest | null>(null);
  const [comment, setComment] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const fetchUserInfo = async (userId: string): Promise<UserInfo | undefined> => {
    try {
      console.log('Fetching user info for ID:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        // Get the user's full name from Firestore
        const fullName = userData.displayName || userData.name || userData.email;
        console.log('Using name:', fullName);
        return {
          name: fullName,
          email: userData.email
        };
      }
      // If no user document exists, return undefined
      console.log('No user document found for ID:', userId);
      return undefined;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return undefined;
    }
  };

  const enrichRequestsWithUserInfo = async (requests: Request[]): Promise<EnrichedRequest[]> => {
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const userInfo = await fetchUserInfo(request.userId);
        return {
          ...request,
          userInfo
        };
      })
    );
    return enrichedRequests;
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await requestService.getAllRequests();
      console.log('Fetched requests:', data);
      const enrichedData = await enrichRequestsWithUserInfo(data);
      setRequests(enrichedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (request: EnrichedRequest) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setComment('');
    setOpenDialog(false);
  };

  const handleApprove = async (requestId: string) => {
    try {
      await requestService.updateRequestStatus(requestId, 'approved');
      await fetchRequests(); // Refresh the list
      handleCloseDialog();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await requestService.updateRequestStatus(requestId, 'rejected');
      await fetchRequests(); // Refresh the list
      handleCloseDialog();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      await requestService.deleteRequest(requestId);
      await fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const filteredRequests = requests.filter((request) => {
    // Filter by type (holiday/special based on tab)
    if (tabValue === 0 && request.type !== 'holiday') return false;
    if (tabValue === 1 && request.type !== 'special') return false;

    // Filter by status
    if (filters.status !== 'all' && request.status !== filters.status) return false;

    // Filter by date range
    if (filters.startDate && new Date(filters.startDate) > request.startDate) return false;
    if (filters.endDate && new Date(filters.endDate) < request.endDate) return false;

    return true;
  });

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = filteredRequests.map(request => request.id!);
      setSelectedRequests(allIds);
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectOne = (requestId: string) => {
    setSelectedRequests(prev => {
      if (prev.includes(requestId)) {
        return prev.filter(id => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  const handleBulkApprove = async () => {
    if (!window.confirm(`Are you sure you want to approve ${selectedRequests.length} requests?`)) {
      return;
    }
    try {
      await Promise.all(selectedRequests.map(id => requestService.updateRequestStatus(id, 'approved')));
      await fetchRequests();
      setSelectedRequests([]);
    } catch (error) {
      console.error('Error bulk approving requests:', error);
    }
  };

  const handleBulkReject = async () => {
    if (!window.confirm(`Are you sure you want to reject ${selectedRequests.length} requests?`)) {
      return;
    }
    try {
      await Promise.all(selectedRequests.map(id => requestService.updateRequestStatus(id, 'rejected')));
      await fetchRequests();
      setSelectedRequests([]);
    } catch (error) {
      console.error('Error bulk rejecting requests:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedRequests.length} requests?`)) {
      return;
    }
    try {
      await Promise.all(selectedRequests.map(id => requestService.deleteRequest(id)));
      await fetchRequests();
      setSelectedRequests([]);
    } catch (error) {
      console.error('Error bulk deleting requests:', error);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Holiday Requests" />
          <Tab label="Special Requests" />
        </Tabs>
        <Stack direction="row" spacing={2}>
          {selectedRequests.length > 0 && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ApproveIcon />}
                onClick={handleBulkApprove}
              >
                Approve ({selectedRequests.length})
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<RejectIcon />}
                onClick={handleBulkReject}
              >
                Reject ({selectedRequests.length})
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
              >
                Delete ({selectedRequests.length})
              </Button>
            </>
          )}
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            variant="outlined"
            size="small"
          >
            Filters
          </Button>
        </Stack>
      </Stack>

      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="From Date"
                type="date"
                size="small"
                fullWidth
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="To Date"
                type="date"
                size="small"
                fullWidth
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                  indeterminate={selectedRequests.length > 0 && selectedRequests.length < filteredRequests.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow 
                key={request.id}
                selected={request.id ? selectedRequests.includes(request.id) : false}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={request.id ? selectedRequests.includes(request.id) : false}
                    onChange={() => request.id && handleSelectOne(request.id)}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>
                      {request.userInfo?.name ? request.userInfo.name.charAt(0) : 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {request.userInfo?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.userInfo?.email || 'No email'}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{format(request.startDate, 'PP')}</TableCell>
                <TableCell>{format(request.endDate, 'PP')}</TableCell>
                <TableCell>{request.reason}</TableCell>
                <TableCell>
                  <Chip
                    label={request.status}
                    color={getStatusChipColor(request.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {request.status === 'pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => request.id && handleApprove(request.id)}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => request.id && handleReject(request.id)}
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Comment">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(request)}
                          >
                            <CommentIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => request.id && handleDeleteRequest(request.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedRequest?.type === 'holiday' ? 'Holiday Request' : 'Special Request'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Agent:</strong> {selectedRequest?.userInfo?.name || 'Unknown User'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Email:</strong> {selectedRequest?.userInfo?.email || 'No email'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Period:</strong>{' '}
              {selectedRequest &&
                `${format(selectedRequest.startDate, 'PP')} - ${format(selectedRequest.endDate, 'PP')}`}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Reason:</strong> {selectedRequest?.reason}
            </Typography>
            <TextField
              label="Comment"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {selectedRequest?.id && selectedRequest.id !== undefined && (
            <>
              <Button 
                onClick={() => handleApprove(selectedRequest.id as string)} 
                color="success"
              >
                Approve
              </Button>
              <Button 
                onClick={() => handleReject(selectedRequest.id as string)} 
                color="error"
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestManagement;
