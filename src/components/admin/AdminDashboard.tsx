import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Container,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

// Import admin components
import RequestManagement from './RequestManagement';
import TeamCalendar from './TeamCalendar';
import ActivityOverview from './ActivityOverview';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeAgents: 0,
    plannedHolidays: 0,
    specialRequests: 0,
  });

  useEffect(() => {
    // Mock statistics
    setStats({
      pendingRequests: 5,
      activeAgents: 12,
      plannedHolidays: 3,
      specialRequests: 2,
    });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Quick Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Requests
              </Typography>
              <Typography variant="h5" component="div">
                {stats.pendingRequests}
              </Typography>
              <EventNoteIcon color="primary" sx={{ fontSize: 40, mt: 2 }} />
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Agents
              </Typography>
              <Typography variant="h5" component="div">
                {stats.activeAgents}
              </Typography>
              <PeopleIcon color="success" sx={{ fontSize: 40, mt: 2 }} />
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Planned Holidays
              </Typography>
              <Typography variant="h5" component="div">
                {stats.plannedHolidays}
              </Typography>
              <BeachAccessIcon color="warning" sx={{ fontSize: 40, mt: 2 }} />
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Special Requests
              </Typography>
              <Typography variant="h5" component="div">
                {stats.specialRequests}
              </Typography>
              <AccessTimeIcon color="info" sx={{ fontSize: 40, mt: 2 }} />
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
            centered
          >
            <Tab label="Request Management" />
            <Tab label="Team Calendar" />
            <Tab label="Activity Overview" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <RequestManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TeamCalendar />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ActivityOverview />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
