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
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getRequests, updateRequest } from '../../services/api';

interface Request {
  id: string;
  type: 'holiday' | 'special';
  employeeName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  submittedAt: string;
}

const RequestManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getRequests('all'); // Fetch all requests for admin
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(fetchRequests, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (request: Request) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setComment('');
  };

  const handleApprove = async (requestId: string) => {
    try {
      await updateRequest(requestId, { status: 'approved', comment });
      const updatedRequests = await getRequests('all');
      setRequests(updatedRequests);
      handleCloseDialog();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateRequest(requestId, { status: 'rejected', comment });
      const updatedRequests = await getRequests('all');
      setRequests(updatedRequests);
      handleCloseDialog();
    } catch (error) {
      console.error('Error rejecting request:', error);
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

  const filteredRequests = requests.filter(request =>
    tabValue === 0 ? request.type === 'holiday' : request.type === 'special'
  );

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Holiday Requests" />
        <Tab label="Special Requests" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.employeeName}</TableCell>
                <TableCell>{format(new Date(request.startDate), 'PP')}</TableCell>
                <TableCell>{format(new Date(request.endDate), 'PP')}</TableCell>
                <TableCell>{request.reason}</TableCell>
                <TableCell>
                  <Chip
                    label={request.status}
                    color={getStatusChipColor(request.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{format(new Date(request.submittedAt), 'PP')}</TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <Box>
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() => handleApprove(request.id)}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleReject(request.id)}
                      >
                        <RejectIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenDialog(request)}
                      >
                        <CommentIcon />
                      </IconButton>
                    </Box>
                  )}
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
              <strong>Employee:</strong> {selectedRequest?.employeeName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Period:</strong>{' '}
              {selectedRequest &&
                `${format(new Date(selectedRequest.startDate), 'PP')} - ${format(
                  new Date(selectedRequest.endDate),
                  'PP'
                )}`}
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
          <Button
            onClick={() => selectedRequest && handleReject(selectedRequest.id)}
            color="error"
          >
            Reject
          </Button>
          <Button
            onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
            color="success"
            variant="contained"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestManagement;
