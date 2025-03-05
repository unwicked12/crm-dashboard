import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  useTheme,
  alpha,
  Chip,
  Paper,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import HolidayRequest from './HolidayRequest';
import ActivityMonitor from './ActivityMonitor';
import WeekScheduleView from './WeekScheduleView';
import SaturdayAvailability from './SaturdayAvailability';
import SpecialRequest from './SpecialRequest';
import MonthlyWorkReport from './MonthlyWorkReport';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const DashboardContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.default,
  minHeight: '100%',
  padding: theme.spacing(2),
}));

const BentoCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.shadows[1],
  margin: 0,
  height: '100%', // Make all cards the same height in their row
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const CardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflow: 'auto',
  flex: '1 1 auto', // Allow content to fill available space
}));

const StatusChip = styled(Chip)<{ color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }>(({ theme, color = 'primary' }) => {
  const colorKey = color as keyof typeof theme.palette;
  const paletteColor = theme.palette[colorKey] as any;
  
  return {
    height: 24,
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor: alpha(paletteColor?.main || theme.palette.primary.main, 0.1),
    color: paletteColor?.main || theme.palette.primary.main,
    border: 'none',
    '& .MuiChip-label': {
      padding: '0 10px',
    },
  };
});

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [isOnline, setIsOnline] = useState(false);
  
  // Track activity status
  useEffect(() => {
    if (user) {
      const checkStatus = async () => {
        try {
          setIsOnline(false); // Default to offline
        } catch (error) {
          console.error("Error checking activity status:", error);
        }
      };
      
      checkStatus();
    }
  }, [user]);

  return (
    <DashboardContainer>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Activity Dashboard
        <StatusChip 
          label={isOnline ? "Online" : "Offline"} 
          color={isOnline ? "success" : "error"}
          size="small"
          sx={{ ml: 2 }}
        />
      </Typography>

      {/* Two-column grid layout */}
      <Grid container spacing={2}>
        {/* First row: Activity Monitoring - Fiche de présence */}
        <Grid item xs={12} md={6}>
          <BentoCard>
            <CardHeader>
              <Typography variant="h6" fontWeight={600}>
                Activity Monitoring
              </Typography>
            </CardHeader>
            <CardContent sx={{ p: 1 }}>
              <ActivityMonitor />
            </CardContent>
          </BentoCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <BentoCard>
            <CardHeader>
              <Typography variant="h6" fontWeight={600}>
              Saturday Availability
              </Typography>
            </CardHeader>
            <CardContent>
              <SaturdayAvailability />
            </CardContent>
          </BentoCard>
        </Grid>

        {/* Second row: Weekly Schedule - Attendance */}
        <Grid item xs={12} md={6}>
          <BentoCard>
            <CardHeader>
              <Typography variant="h6" fontWeight={600}>
                Weekly Schedule
              </Typography>
            </CardHeader>
            <CardContent>
              <WeekScheduleView />
            </CardContent>
          </BentoCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <BentoCard>
            <CardContent>
              <MonthlyWorkReport />
            </CardContent>
          </BentoCard>
        </Grid>

        {/* Third row: Holiday requests - Special Requests */}
        <Grid item xs={12} md={6}>
          <BentoCard>
            <CardContent>
              <HolidayRequest />
            </CardContent>
          </BentoCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <BentoCard>
            <CardContent>
              <SpecialRequest />
            </CardContent>
          </BentoCard>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;