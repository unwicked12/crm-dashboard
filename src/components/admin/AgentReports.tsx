import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AgentMetrics {
  id: string;
  name: string;
  totalLateMinutes: number;
  absenceDays: number;
  averageLoginTime: string;
  performanceScore: number;
  taskCompletion: number;
}

interface AttendanceStats {
  onTime: number;
  late: number;
  absent: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AgentReports: React.FC = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    onTime: 0,
    late: 0,
    absent: 0,
  });

  // Simulated data - replace with actual API calls
  useEffect(() => {
    // Mock data for demonstration
    const mockAgentMetrics: AgentMetrics[] = [
      {
        id: '1',
        name: 'John Doe',
        totalLateMinutes: 45,
        absenceDays: 2,
        averageLoginTime: '09:10',
        performanceScore: 85,
        taskCompletion: 92,
      },
      {
        id: '2',
        name: 'Jane Smith',
        totalLateMinutes: 15,
        absenceDays: 1,
        averageLoginTime: '08:55',
        performanceScore: 95,
        taskCompletion: 98,
      },
      {
        id: '3',
        name: 'Mike Johnson',
        totalLateMinutes: 120,
        absenceDays: 3,
        averageLoginTime: '09:20',
        performanceScore: 75,
        taskCompletion: 85,
      },
    ];

    const mockAttendanceStats = {
      onTime: 85,
      late: 12,
      absent: 3,
    };

    setAgentMetrics(mockAgentMetrics);
    setAttendanceStats(mockAttendanceStats);
  }, [timeframe]);

  const attendanceData = [
    { name: 'On Time', value: attendanceStats.onTime },
    { name: 'Late', value: attendanceStats.late },
    { name: 'Absent', value: attendanceStats.absent },
  ];

  const performanceData = agentMetrics.map(agent => ({
    name: agent.name,
    performance: agent.performanceScore,
    tasks: agent.taskCompletion,
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Agent Performance Reports
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Attendance Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Overview
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="performance" fill="#8884d8" name="Performance Score" />
                    <Bar dataKey="tasks" fill="#82ca9d" name="Task Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Agent Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Agent Metrics
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent Name</TableCell>
                      <TableCell align="right">Total Late (mins)</TableCell>
                      <TableCell align="right">Absence Days</TableCell>
                      <TableCell align="right">Avg. Login Time</TableCell>
                      <TableCell align="right">Performance Score</TableCell>
                      <TableCell align="right">Task Completion %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agentMetrics.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>{agent.name}</TableCell>
                        <TableCell align="right">{agent.totalLateMinutes}</TableCell>
                        <TableCell align="right">{agent.absenceDays}</TableCell>
                        <TableCell align="right">{agent.averageLoginTime}</TableCell>
                        <TableCell align="right">{agent.performanceScore}%</TableCell>
                        <TableCell align="right">{agent.taskCompletion}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentReports;
