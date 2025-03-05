import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Card,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PlayArrow as CheckInIcon,
  Stop as CheckOutIcon,
  Restaurant as LunchIcon,
  Coffee as BreakIcon,
  AccessTime as ClockIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { format, differenceInMinutes, isToday, startOfDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { activityService, UserStatus } from '../../services/activityService';
import { 
  getFirestore,
  doc,
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  Timestamp,
  type DocumentSnapshot,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface ActivityLog {
  id: string;
  type: UserStatus;
  timestamp: Date;
}

interface ActivityDocument {
  status: UserStatus;
  lastAction: string;
  lastActionTime: {
    seconds: number;
    nanoseconds: number;
    toDate?: () => Date;
  };
  userName: string;
  email: string;
  currentTask?: string;
} 