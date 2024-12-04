import React from 'react';
import { Box, Container, Grid, Paper } from '@mui/material';
import ActivityMonitor from './ActivityMonitor';
import AgentScheduleView from './AgentScheduleView';
import HolidayRequest from './HolidayRequest';
import SpecialRequest from './SpecialRequest';
import MonthlyWorkReport from './MonthlyWorkReport';

const Dashboard = () => {
  return (
    <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
      <Grid 
        container 
        spacing={2} 
        sx={{ 
          height: '100%',
          p: 2,
          '& > .MuiGrid-item': {
            paddingTop: '16px',
          }
        }}
      >
        {/* Left Column - Main Content */}
        <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Schedule View */}
          <Box sx={{ mb: 2 }}>
            <Paper 
              sx={{ 
                p: 2,
                height: '100%',
                backgroundColor: 'background.paper',
              }}
            >
              <AgentScheduleView />
            </Paper>
          </Box>

          {/* Activity Monitor - Scrollable */}
          <Box 
            sx={{ 
              flex: 1,
              mb: 2,
              minHeight: 0, // Important for proper scrolling
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Paper 
              sx={{ 
                p: 2,
                height: '100%',
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // Hide overflow at container level
              }}
            >
              <ActivityMonitor />
            </Paper>
          </Box>

          {/* Monthly Report - At the bottom */}
          <Box>
            <Paper 
              sx={{ 
                p: 2,
                backgroundColor: 'background.paper'
              }}
            >
              <MonthlyWorkReport />
            </Paper>
          </Box>
        </Grid>

        {/* Right Column - Requests */}
        <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 2 }}>
            <Paper 
              sx={{ 
                p: 2,
                backgroundColor: 'background.paper'
              }}
            >
              <HolidayRequest />
            </Paper>
          </Box>
          <Box>
            <Paper 
              sx={{ 
                p: 2,
                backgroundColor: 'background.paper'
              }}
            >
              <SpecialRequest />
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
