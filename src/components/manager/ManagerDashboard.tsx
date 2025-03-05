import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  styled,
  Tabs,
  Tab,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SaturdayAvailabilityApproval from './SaturdayAvailabilityApproval';
import TeamCalendar from '../admin/TeamCalendar';
import HolidayRequestApproval from './HolidayRequestApproval';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

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
      id={`manager-tabpanel-${index}`}
      aria-labelledby={`manager-tab-${index}`}
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

// Helper function to determine the initial tab based on URL
const getInitialTab = (pathname: string): number => {
  if (pathname.includes('/manager/saturday')) return 0;
  if (pathname.includes('/manager/holiday')) return 1;
  if (pathname.includes('/manager/schedule')) return 2;
  return 0; // Default to first tab
};

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(getInitialTab(location.pathname));

  // Update URL when tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const paths = ['/manager', '/manager/holiday', '/manager/schedule'];
    navigate(paths[newValue]);
  };

  // Update tab if URL changes externally
  useEffect(() => {
    setTabValue(getInitialTab(location.pathname));
  }, [location.pathname]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manager Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Welcome, {user?.name}. Manage your team's schedules and requests.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="manager dashboard tabs">
          <Tab label="Saturday Availability Requests" id="manager-tab-0" aria-controls="manager-tabpanel-0" />
          <Tab label="Holiday Requests" id="manager-tab-1" aria-controls="manager-tabpanel-1" />
          <Tab label="Team Schedule" id="manager-tab-2" aria-controls="manager-tabpanel-2" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledPaper>
              <SaturdayAvailabilityApproval />
            </StyledPaper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledPaper>
              <HolidayRequestApproval />
            </StyledPaper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledPaper>
              <TeamCalendar />
            </StyledPaper>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default ManagerDashboard; 