import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as CheckInIcon,
  Stop as CheckOutIcon,
  Restaurant as LunchIcon,
  Coffee as BreakIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import type { QuerySnapshot, DocumentData, QueryDocumentSnapshot } from '@firebase/firestore-types';
import { db } from '../../firebase';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { activityService, UserStatus } from '../../services/activityService';

interface UserActivity {
  userId: string;
  userName: string;
  status: UserStatus;
  lastActionTime: Date;
  currentTask?: string;
  email: string;
  avatarUrl?: string;
}

const ActivityOverview: React.FC = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'monitoring'),
      orderBy('lastActionTime', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const activityData: UserActivity[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        activityData.push({
          userId: doc.id,
          userName: data.userName || 'Unknown User',
          status: data.status,
          lastActionTime: data.lastActionTime?.toDate() || new Date(),
          currentTask: data.currentTask,
          email: data.email || '',
          avatarUrl: data.avatarUrl,
        });
      });
      setActivities(activityData);
      setLoading(false);
    }, (error: Error) => {
      console.error('Error fetching activities:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'checked-in':
        return <CheckInIcon sx={{ color: 'success.main' }} />;
      case 'checked-out':
        return <CheckOutIcon sx={{ color: 'error.main' }} />;
      case 'lunch':
        return <LunchIcon sx={{ color: 'warning.main' }} />;
      case 'break':
        return <BreakIcon sx={{ color: 'info.main' }} />;
      default:
        return <CheckOutIcon sx={{ color: 'error.main' }} />;
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'checked-in':
        return 'success';
      case 'checked-out':
        return 'error';
      case 'lunch':
        return 'warning';
      case 'break':
        return 'info';
      default:
        return 'error';
    }
  };

  const getStatusText = (status: UserStatus): string => {
    switch (status) {
      case 'checked-in':
        return 'Available';
      case 'checked-out':
        return 'Offline';
      case 'lunch':
        return 'Lunch Break';
      case 'break':
        return 'Short Break';
      default:
        return 'Offline';
    }
  };

  const handleRefresh = () => {
    setLoading(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleStatusChange = async (status: UserStatus) => {
    if (user && selectedUserId === user.uid) {
      switch (status) {
        case 'checked-in':
          await activityService.setUserOnline(user);
          break;
        case 'checked-out':
          await activityService.setUserOffline(user);
          break;
        case 'lunch':
          await activityService.setUserLunch(user);
          break;
        case 'break':
          await activityService.setUserBreak(user);
          break;
      }
    }
    handleMenuClose();
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Real-Time Activity Monitor</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Task</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.userId}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={activity.avatarUrl} alt={activity.userName}>
                      {activity.userName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{activity.userName}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.email}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(activity.status)}
                    label={getStatusText(activity.status)}
                    size="small"
                    color={getStatusColor(activity.status) as any}
                    sx={{ 
                      textTransform: 'capitalize',
                      fontWeight: 'medium',
                      fontSize: '0.875rem',
                      padding: '4px 8px'
                    }}
                  />
                </TableCell>
                <TableCell>
                  {activity.currentTask || 'No active task'}
                </TableCell>
                <TableCell>
                  {format(activity.lastActionTime, 'HH:mm:ss')}
                </TableCell>
                <TableCell align="right">
                  {activity.userId === user?.uid && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, activity.userId)}
                    >
                      <MoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('checked-in')}>
          <CheckInIcon sx={{ mr: 1, color: 'success.main' }} /> Available
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('lunch')}>
          <LunchIcon sx={{ mr: 1, color: 'warning.main' }} /> Lunch Break
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('break')}>
          <BreakIcon sx={{ mr: 1, color: 'info.main' }} /> Short Break
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('checked-out')}>
          <CheckOutIcon sx={{ mr: 1, color: 'error.main' }} /> Offline
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ActivityOverview;
