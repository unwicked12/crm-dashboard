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
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { requestService, Request } from '../../services/requestService';
import { userService } from '../../services/userService';
import { User } from '../../types/user';

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
      id={`approval-tabpanel-${index}`}
      aria-labelledby={`approval-tab-${index}`}
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

const SaturdayAvailabilityApproval: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog state
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Fetch all Saturday availability requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const saturdayRequests = await requestService.getSaturdayAvailabilityRequests();
      setRequests(saturdayRequests);
      
      // Fetch user details for each request
      const userIds = Array.from(new Set(saturdayRequests.map(req => req.userId)));
      const userMap = new Map<string, User>();
      
      for (const userId of userIds) {
        try {
          const user = await userService.getUserById(userId);
          if (user) {
            userMap.set(userId, user as User);
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }
      
      setUsers(userMap);
    } catch (error: any) {
      console.error('Error fetching Saturday availability requests:', error);
      setError(error.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data loading
  useEffect(() => {
    fetchRequests();
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Open approve dialog
  const handleOpenApproveDialog = (request: Request) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };
  
  // Open reject dialog
  const handleOpenRejectDialog = (request: Request) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };
  
  // Open details dialog
  const handleOpenDetailsDialog = (request: Request) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };
  
  // Approve request
  const handleApproveRequest = async () => {
    if (!selectedRequest?.id) return;
    
    try {
      setLoading(true);
      
      // Update request status
      await requestService.updateRequestStatus(selectedRequest.id, 'approved');
      
      // Update user's Saturday availability
      if (selectedRequest.userId) {
        const options: any = {};
        
        if (selectedRequest.date) {
          options.date = selectedRequest.date;
        } else if (selectedRequest.month && selectedRequest.year) {
          options.month = selectedRequest.month;
          options.year = selectedRequest.year;
        }
        
        await userService.updateSaturdayAvailability(
          selectedRequest.userId,
          selectedRequest.newAvailability || false,
          selectedRequest.userId,
          options
        );
      }
      
      setSuccessMessage('Request approved successfully');
      setApproveDialogOpen(false);
      
      // Refresh requests
      await fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      setError(error.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };
  
  // Reject request
  const handleRejectRequest = async () => {
    if (!selectedRequest?.id) return;
    
    try {
      setLoading(true);
      
      // Update request status
      await requestService.updateRequestStatus(selectedRequest.id, 'rejected');
      
      setSuccessMessage('Request rejected successfully');
      setRejectDialogOpen(false);
      
      // Refresh requests
      await fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      setError(error.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter requests by status
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');
  
  // Render request table
  const renderRequestTable = (filteredRequests: Request[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Agent</TableCell>
            <TableCell>Request Type</TableCell>
            <TableCell>New Availability</TableCell>
            <TableCell>Requested On</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No requests found
              </TableCell>
            </TableRow>
          ) : (
            filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {users.get(request.userId)?.name || request.userId}
                </TableCell>
                <TableCell>
                  {request.date ? 'Specific Date' : 
                   request.month && request.year ? 'Month' : 'General'}
                  {request.date && `: ${format(request.date, 'dd/MM/yyyy')}`}
                  {request.month && request.year && !request.date && `: ${request.month}/${request.year}`}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.newAvailability ? 'Available' : 'Not Available'} 
                    color={request.newAvailability ? 'success' : 'error'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {request.createdAt && format(request.createdAt, 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} 
                    color={
                      request.status === 'pending' ? 'warning' : 
                      request.status === 'approved' ? 'success' : 'error'
                    } 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<InfoIcon />} 
                      onClick={() => handleOpenDetailsDialog(request)}
                    >
                      Details
                    </Button>
                    
                    {request.status === 'pending' && (
                      <>
                        <Button 
                          size="small" 
                          color="success" 
                          startIcon={<ApproveIcon />} 
                          onClick={() => handleOpenApproveDialog(request)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          color="error" 
                          startIcon={<RejectIcon />} 
                          onClick={() => handleOpenRejectDialog(request)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  if (loading && requests.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Saturday Availability Requests
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="request tabs">
          <Tab 
            label={`Pending (${pendingRequests.length})`} 
            id="request-tab-0" 
            aria-controls="request-tabpanel-0" 
          />
          <Tab 
            label={`Approved (${approvedRequests.length})`} 
            id="request-tab-1" 
            aria-controls="request-tabpanel-1" 
          />
          <Tab 
            label={`Rejected (${rejectedRequests.length})`} 
            id="request-tab-2" 
            aria-controls="request-tabpanel-2" 
          />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {renderRequestTable(pendingRequests)}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderRequestTable(approvedRequests)}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {renderRequestTable(rejectedRequests)}
      </TabPanel>
      
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve this Saturday availability request?
            {selectedRequest?.date && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                Date: {format(selectedRequest.date, 'dd/MM/yyyy')}
              </Box>
            )}
            {selectedRequest?.month && selectedRequest?.year && !selectedRequest?.date && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                Month: {selectedRequest.month}/{selectedRequest.year}
              </Box>
            )}
            <Box component="span" sx={{ display: 'block', mt: 1 }}>
              New Availability: {selectedRequest?.newAvailability ? 'Available' : 'Not Available'}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleApproveRequest} 
            color="success" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject this Saturday availability request?
            {selectedRequest?.date && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                Date: {format(selectedRequest.date, 'dd/MM/yyyy')}
              </Box>
            )}
            {selectedRequest?.month && selectedRequest?.year && !selectedRequest?.date && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                Month: {selectedRequest.month}/{selectedRequest.year}
              </Box>
            )}
            <Box component="span" sx={{ display: 'block', mt: 1 }}>
              New Availability: {selectedRequest?.newAvailability ? 'Available' : 'Not Available'}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectRequest} 
            color="error" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Agent: {users.get(selectedRequest.userId)?.name || selectedRequest.userId}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Request Type: 
                {selectedRequest.date ? ' Specific Date' : 
                 selectedRequest.month && selectedRequest.year ? ' Month' : ' General'}
                {selectedRequest.date && `: ${format(selectedRequest.date, 'dd/MM/yyyy')}`}
                {selectedRequest.month && selectedRequest.year && !selectedRequest.date && 
                  `: ${selectedRequest.month}/${selectedRequest.year}`}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                New Availability: {selectedRequest.newAvailability ? 'Available' : 'Not Available'}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Requested On: {selectedRequest.createdAt && 
                  format(selectedRequest.createdAt, 'dd/MM/yyyy HH:mm')}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Status: 
                <Chip 
                  label={selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)} 
                  color={
                    selectedRequest.status === 'pending' ? 'warning' : 
                    selectedRequest.status === 'approved' ? 'success' : 'error'
                  } 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Reason:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1">
                  {selectedRequest.reason || 'No reason provided'}
                </Typography>
              </Paper>
              
              {selectedRequest.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    color="success" 
                    variant="contained" 
                    startIcon={<ApproveIcon />} 
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleOpenApproveDialog(selectedRequest);
                    }}
                  >
                    Approve
                  </Button>
                  <Button 
                    color="error" 
                    variant="contained" 
                    startIcon={<RejectIcon />} 
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleOpenRejectDialog(selectedRequest);
                    }}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SaturdayAvailabilityApproval; 