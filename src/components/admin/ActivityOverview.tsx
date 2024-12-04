import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as OnlineIcon,
  Cancel as OfflineIcon,
  Coffee as BreakIcon,
  AccessTime as ClockIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface AgentActivity {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'break' | 'lunch';
  lastActive: string;
  totalHoursToday: number;
  breakTime: number;
}

interface ActivityLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
}

const ActivityOverview: React.FC = () => {
  const [agents, setAgents] = useState<AgentActivity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    // TODO: Replace with actual API calls
    const mockAgents: AgentActivity[] = [
      {
        id: '1',
        name: 'John Doe',
        status: 'online',
        lastActive: new Date().toISOString(),
        totalHoursToday: 6.5,
        breakTime: 45,
      },
      {
        id: '2',
        name: 'Jane Smith',
        status: 'break',
        lastActive: new Date().toISOString(),
        totalHoursToday: 4,
        breakTime: 30,
      },
    ];

    const mockLogs: ActivityLog[] = [
      {
        id: '1',
        agentName: 'John Doe',
        action: 'Checked in',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        agentName: 'Jane Smith',
        action: 'Started break',
        timestamp: new Date().toISOString(),
      },
    ];

    setAgents(mockAgents);
    setActivityLogs(mockLogs);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <OnlineIcon color="success" />;
      case 'offline':
        return <OfflineIcon color="error" />;
      case 'break':
      case 'lunch':
        return <BreakIcon color="warning" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'break':
      case 'lunch':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Current Status Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Hours Today</TableCell>
                  <TableCell>Break Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>{agent.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(agent.status)}
                        <Chip
                          label={agent.status}
                          size="small"
                          color={getStatusColor(agent.status) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(agent.lastActive), 'HH:mm')}
                    </TableCell>
                    <TableCell>
                      {agent.totalHoursToday.toFixed(1)} hrs
                    </TableCell>
                    <TableCell>
                      {agent.breakTime} min
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Activity Log Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Activity Log
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.timestamp), 'HH:mm')}
                    </TableCell>
                    <TableCell>{log.agentName}</TableCell>
                    <TableCell>{log.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActivityOverview;
