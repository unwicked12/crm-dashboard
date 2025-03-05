import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import SaturdayAvailabilityApproval from './SaturdayAvailabilityApproval';

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

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
              <Typography variant="h5" gutterBottom>
                Holiday Requests
              </Typography>
              <Typography variant="body1">
                Holiday request management will be implemented here.
              </Typography>
            </StyledPaper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledPaper>
              <Typography variant="h5" gutterBottom>
                Team Schedule
              </Typography>
              <Typography variant="body1">
                Team schedule management will be implemented here.
              </Typography>
            </StyledPaper>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default ManagerDashboard; 