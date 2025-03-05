// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
  Avatar,
  Alert,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  PhoneInTalk as CallIcon,
  Computer as CRMIcon,
  School as InternIcon,
  Security as ComplianceIcon,
} from '@mui/icons-material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDoc
} from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { QueryDocumentSnapshot, DocumentData } from '@firebase/firestore-types';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateEmail,
  deleteUser,
  signInWithEmailAndPassword
} from 'firebase/auth';

interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'user';
  tier: UserTier;
  scheduleType: 'standard' | 'short' | 'nine';
  capabilities: {
    canDoCRM: boolean;
    canDoCalls: boolean;
    isIntern: boolean;
    canDoCompliance: boolean;
  };
  createdAt: Date;
  lastLogin?: Date;
}

type UserTier = 'tier1' | 'tier2' | 'tier3' | 'compliance';

interface TierCapabilities {
  canDoCRM: boolean;
  canDoCalls: boolean;
  isIntern: boolean;
  canDoCompliance: boolean;
}

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'hr' | 'user';
  tier: UserTier;
  scheduleType: 'standard' | 'short' | 'nine';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TIER_INFO = {
  tier1: {
    label: 'Tier 1 (Intern)',
    color: 'info',
    description: 'Training phase - Learning the basics',
    icon: <InternIcon />,
    capabilities: {
      canDoCRM: false,
      canDoCalls: false,
      isIntern: true,
      canDoCompliance: false,
    },
  },
  tier2: {
    label: 'Tier 2 (CRM)',
    color: 'success',
    description: 'Can handle CRM tasks',
    icon: <CRMIcon />,
    capabilities: {
      canDoCRM: true,
      canDoCalls: false,
      isIntern: false,
      canDoCompliance: false,
    },
  },
  tier3: {
    label: 'Tier 3 (Full Access)',
    color: 'primary',
    description: 'Can handle both CRM and Calls',
    icon: <PersonIcon />,
    capabilities: {
      canDoCRM: true,
      canDoCalls: true,
      isIntern: false,
      canDoCompliance: false,
    },
  },
  compliance: {
    label: 'Compliance',
    description: 'Full access with Compliance capabilities',
    color: 'warning',
    icon: <ComplianceIcon />,
    capabilities: {
      canDoCRM: true,
      canDoCalls: true,
      isIntern: false,
      canDoCompliance: true,
    },
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UserManagement: React.FC = () => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [users, setUsers] = useState<User[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [openDialog, setOpenDialog] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'user',
    tier: 'tier1',
    scheduleType: 'standard'
  });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [snackbarOpen, setSnackbarOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check Firestore connection
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkFirestoreConnection();
  }, []);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkFirestoreConnection = async () => {
    try {
      // Try to fetch a small document to test connection
      await getDoc(doc(db, 'settings', 'app'));
      setConnectionError(null);
      // If connection is successful, fetch users
      fetchUsers();
    } catch (err: any) {
      console.error('Firestore connection error:', err);
      setConnectionError(
        'Unable to connect to Firestore. This may be due to CORS issues or network problems. ' +
        'Please check your network connection and browser console for more details.'
      );
    }
  };

  // Ensure capabilities have all required properties
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ensureValidCapabilities = (capabilities: any): TierCapabilities => {
    const defaultCapabilities = {
      canDoCRM: false,
      canDoCalls: false,
      isIntern: true,
      canDoCompliance: false
    };
    
    if (!capabilities) return defaultCapabilities;
    
    return {
      canDoCRM: typeof capabilities.canDoCRM === 'boolean' ? capabilities.canDoCRM : defaultCapabilities.canDoCRM,
      canDoCalls: typeof capabilities.canDoCalls === 'boolean' ? capabilities.canDoCalls : defaultCapabilities.canDoCalls,
      isIntern: typeof capabilities.isIntern === 'boolean' ? capabilities.isIntern : defaultCapabilities.isIntern,
      canDoCompliance: typeof capabilities.canDoCompliance === 'boolean' ? capabilities.canDoCompliance : defaultCapabilities.canDoCompliance
    };
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userData: User[] = [];
      
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        // Get the tier value and normalize it to lowercase for case-insensitive comparison
        const rawTier = data.tier || 'tier1';
        
        // Try to match the tier case-insensitively
// eslint-disable-next-line @typescript-eslint/no-unused-vars
        let userTier: UserTier = 'tier1';
        
        // Check if the tier exists in TIER_INFO directly
        if (TIER_INFO[rawTier as UserTier]) {
          userTier = rawTier as UserTier;
        } else {
          // Try to match case-insensitively
          const tierKeys = Object.keys(TIER_INFO) as UserTier[];
          const matchedTier = tierKeys.find(key => 
            key.toLowerCase() === rawTier.toLowerCase()
          );
          
          if (matchedTier) {
            userTier = matchedTier;
            // Removed console.log
          } else {
            console.warn(`Invalid tier value found: ${rawTier}, defaulting to tier1`);
          }
        }
        
        // Use existing capabilities if they exist, otherwise use the tier's default capabilities
        const capabilities = data.capabilities 
          ? ensureValidCapabilities(data.capabilities)
          : ensureValidCapabilities(TIER_INFO[userTier].capabilities);
        
        userData.push({
          uid: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          tier: userTier,
          scheduleType: data.scheduleType || 'standard',
          capabilities: capabilities,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate()
        });
      });
      
      setUsers(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        password: '', // Don't show existing password
        name: user.name,
        role: user.role,
        tier: user.tier,
        scheduleType: user.scheduleType || 'standard'
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'user',
        tier: 'tier1',
        scheduleType: 'standard'
      });
    }
    setOpenDialog(true);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'user',
      tier: 'tier1',
      scheduleType: 'standard'
    });
    setError(null);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateFormData = () => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const errors: string[] = [];
    
    if (!formData.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Invalid email format');
    }

    if (!formData.password?.trim()) {
      errors.push('Password is required');
    } else if (formData.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (!formData.name?.trim()) {
      errors.push('Name is required');
    }

    if (!formData.role) {
      errors.push('Role is required');
    }

    if (!formData.tier) {
      errors.push('Tier is required');
    }

    if (!formData.scheduleType) {
      errors.push('Schedule type is required');
    }

    return errors;
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate form data
      const validationErrors = validateFormData();
      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'));
        return;
      }

      const auth = getAuth();
      
      // Check if email already exists in Firestore
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', formData.email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setError('A user with this email already exists');
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      // Create user document in Firestore with the SAME ID as Auth UID
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userRef = doc(db, 'users', newUser.uid);
      
      // Ensure the tier is valid
      let userTier = formData.tier;
      
      // Check if the tier exists in TIER_INFO directly
      if (!TIER_INFO[userTier]) {
        // Try to match case-insensitively
        const tierKeys = Object.keys(TIER_INFO) as UserTier[];
        const matchedTier = tierKeys.find(key => 
          key.toLowerCase() === userTier.toLowerCase()
        );
        
        if (matchedTier) {
          userTier = matchedTier;
          // Removed console.log
        } else {
          console.warn(`Invalid tier value found: ${userTier}, defaulting to tier1`);
          userTier = 'tier1';
        }
      }
      
      const capabilities = ensureValidCapabilities(TIER_INFO[userTier].capabilities);
      
      const userData = {
        id: newUser.uid,
        uid: newUser.uid,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        tier: userTier,
        scheduleType: formData.scheduleType,
        capabilities: capabilities,
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: null,
        lastActive: null
      };

      await setDoc(userRef, userData);

      // Send email verification
      await newUser.sendEmailVerification();

      // Refresh the users list
      await fetchUsers();
      handleCloseDialog();
      
      // Show success message
      setSnackbarMessage('User created successfully. Verification email sent.');
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user';
      
      // Handle specific Firebase Auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userRef = doc(db, 'users', selectedUser.uid);
      
      // Ensure the tier is valid
      let userTier = formData.tier;
      
      // Check if the tier exists in TIER_INFO directly
      if (!TIER_INFO[userTier]) {
        // Try to match case-insensitively
        const tierKeys = Object.keys(TIER_INFO) as UserTier[];
        const matchedTier = tierKeys.find(key => 
          key.toLowerCase() === userTier.toLowerCase()
        );
        
        if (matchedTier) {
          userTier = matchedTier;
          // Removed console.log
        } else {
          console.warn(`Invalid tier value found: ${userTier}, defaulting to tier1`);
          userTier = 'tier1';
        }
      }
      
      const capabilities = ensureValidCapabilities(TIER_INFO[userTier].capabilities);
      
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updateData: any = {
        name: formData.name,
        role: formData.role,
        tier: userTier,
        scheduleType: formData.scheduleType,
        capabilities: capabilities,
        updatedAt: new Date()
      };

      // Update email if it has changed
      if (formData.email !== selectedUser.email) {
        const auth = getAuth();
        if (auth.currentUser) {
          await updateEmail(auth.currentUser, formData.email);
          updateData.email = formData.email;
        }
      }

      await setDoc(userRef, updateData, { merge: true });
      await fetchUsers();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      // Delete from Firestore - the Cloud Function will handle the Firebase Auth deletion
      await deleteDoc(doc(db, 'users', user.uid));
      await fetchUsers();
      setError(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async () => {
    if (selectedUser) {
      await updateUser();
    } else {
      await createUser();
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderCapabilityChips = (capabilities: User['capabilities']) => (
    <Stack direction="row" spacing={1}>
      {capabilities.canDoCalls && (
        <Chip
          icon={<CallIcon />}
          label="Calls"
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
      {capabilities.canDoCRM && (
        <Chip
          icon={<CRMIcon />}
          label="CRM"
          size="small"
          color="success"
          variant="outlined"
        />
      )}
      {capabilities.canDoCompliance && (
        <Chip
          icon={<ComplianceIcon />}
          label="Compliance"
          size="small"
          color="warning"
          variant="outlined"
        />
      )}
      {capabilities.isIntern && (
        <Chip
          icon={<InternIcon />}
          label="Intern"
          size="small"
          color="info"
          variant="outlined"
        />
      )}
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>
      
      {connectionError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={checkFirestoreConnection}>
              Retry Connection
            </Button>
          }
        >
          {connectionError}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Capabilities</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>{user.name.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="body1">{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      user.role === 'admin' 
                        ? 'Admin' 
                        : user.role === 'hr'
                          ? 'HR'
                          : 'User'
                    }
                    color={
                      user.role === 'admin' 
                        ? 'primary'
                        : user.role === 'hr'
                          ? 'secondary'
                          : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={TIER_INFO[user.tier].icon}
                    label={TIER_INFO[user.tier].label}
                    color={TIER_INFO[user.tier].color as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {renderCapabilityChips(user.capabilities)}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteUser(user)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {!selectedUser && (
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'hr' | 'user' })}
                label="Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Tier</InputLabel>
              <Select
                value={formData.tier}
                label="Tier"
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as UserTier })}
              >
                <MenuItem value="tier1">{TIER_INFO.tier1.label}</MenuItem>
                <MenuItem value="tier2">{TIER_INFO.tier2.label}</MenuItem>
                <MenuItem value="tier3">{TIER_INFO.tier3.label}</MenuItem>
                <MenuItem value="compliance">{TIER_INFO.compliance.label}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                value={formData.scheduleType}
                label="Schedule Type"
                onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value as 'standard' | 'short' | 'nine' })}
              >
                <MenuItem value="standard">40 heures par semaine</MenuItem>
                <MenuItem value="short">39 heures par semaine (1 journée courte)</MenuItem>
                <MenuItem value="nine">9 heures par semaine</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;