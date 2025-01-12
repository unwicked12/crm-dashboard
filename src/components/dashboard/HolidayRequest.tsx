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
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { requestService, Request } from '../../services/requestService';

interface HolidayRequest extends Request {
  type: 'holiday';
}

const HolidayRequest: React.FC = () => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [expanded, setExpanded] = useState<string | false>(false);
  const [requests, setRequests] = useState<HolidayRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchRequests = async (userId: string) => {
    try {
      const data = await requestService.getUserRequests(userId);
      const holidayRequests = data.filter((req) => req.type === 'holiday') as HolidayRequest[];
      console.log('Fetched holiday requests:', holidayRequests); // Debug log
      setRequests(holidayRequests);
    } catch (error) {
      console.error('Error fetching holiday requests:', error);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    fetchRequests(user.uid);

    const refreshInterval = setInterval(() => fetchRequests(user.uid), 30000);
    return () => clearInterval(refreshInterval);
  }, [user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason || !user?.uid) {
      console.error('Missing required fields or user not authenticated');
      return;
    }

    setLoading(true);
    try {
      await requestService.createRequest({
        type: 'holiday',
        startDate,
        endDate,
        reason,
        userId: user.uid
      });

      // Refresh the requests list
      await fetchRequests(user.uid);

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setReason('');
    } catch (error) {
      console.error('Error submitting holiday request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.main,
        };
      case 'rejected':
        return {
          bg: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
        };
      default:
        return {
          bg: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.main,
        };
    }
  };

  return (
    <Box>
      <Card
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          New Holiday Request
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(date) => setStartDate(date)}
                slots={{
                  openPickerIcon: CalendarIcon,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(date) => setEndDate(date)}
                slots={{
                  openPickerIcon: CalendarIcon,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Stack>

            <TextField
              label="Reason for Leave"
              fullWidth
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <EventIcon
                    sx={{ mr: 1, mt: 1.5, color: theme.palette.text.secondary }}
                  />
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                endIcon={<SendIcon />}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                  },
                }}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Card>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ mb: 3, fontWeight: 600, color: theme.palette.text.primary }}
        >
          Previous Holiday Requests
        </Typography>

        {requests.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No holiday requests found
          </Typography>
        ) : (
          requests.map((request) => (
            <Accordion
              key={request.id || 'new'}
              expanded={expanded === (request.id || 'new')}
              onChange={handleAccordionChange(request.id || 'new')}
              elevation={0}
              sx={{
                mb: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px !important',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '0 0 16px 0',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ width: '100%' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {format(request.startDate, 'MMM dd')} - {format(request.endDate, 'MMM dd, yyyy')}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ mt: 0.5 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon
                          sx={{
                            fontSize: 16,
                            color: theme.palette.text.secondary,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          Requested on {format(request.createdAt || new Date(), 'MMM dd, yyyy')}
                        </Typography>
                      </Stack>
                      <Chip
                        label={request.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(request.status).bg,
                          color: getStatusColor(request.status).color,
                          textTransform: 'capitalize',
                          fontWeight: 500,
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <Typography color="text.secondary">{request.reason}</Typography>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Box>
  );
};

export default HolidayRequest;
