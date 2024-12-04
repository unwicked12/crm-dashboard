import React, { useState } from 'react';
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
  Description as DescriptionIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Request {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

const SpecialRequest: React.FC = () => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expanded, setExpanded] = useState<string | false>(false);

  // Sample previous requests data
  const previousRequests: Request[] = [
    {
      id: '1',
      title: 'Work from Home Request',
      description: 'Request to work from home due to transportation issues',
      date: '2023-11-20T09:00:00',
      status: 'approved',
    },
    {
      id: '2',
      title: 'Equipment Request',
      description: 'Need a second monitor for better productivity',
      date: '2023-11-18T14:30:00',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Schedule Adjustment',
      description: 'Request to adjust working hours next week',
      date: '2023-11-15T11:20:00',
      status: 'rejected',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log({ title, description });
    setTitle('');
    setDescription('');
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
          New Special Request
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Request Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <DescriptionIcon
                    sx={{ mr: 1, color: theme.palette.text.secondary }}
                  />
                ),
              }}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              variant="outlined"
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
              >
                Submit Request
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
          Previous Requests
        </Typography>

        {previousRequests.map((request) => (
          <Accordion
            key={request.id}
            expanded={expanded === request.id}
            onChange={handleAccordionChange(request.id)}
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {request.title}
                  </Typography>
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
                        {format(new Date(request.date), 'MMM dd, yyyy HH:mm')}
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
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Edit Request">
                    <IconButton
                      size="small"
                      sx={{
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Request">
                    <IconButton
                      size="small"
                      sx={{
                        color: theme.palette.error.main,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.2),
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Typography color="text.secondary">{request.description}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default SpecialRequest;
