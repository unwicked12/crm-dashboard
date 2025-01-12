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
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from '@firebase/firestore-types';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateEmail,
  deleteUser,
} from 'firebase/auth';

interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  tier: UserTier;
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

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  tier: UserTier;
}

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

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'user',
    tier: 'tier1'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const userData: User[] = [];
      
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        const userTier = (data.tier || 'tier1') as UserTier;
        userData.push({
          uid: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          tier: userTier,
          capabilities: TIER_INFO[userTier].capabilities,
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        password: '', // Don't show existing password
        name: user.name,
        role: user.role,
        tier: user.tier
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'user',
        tier: 'tier1'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'user',
      tier: 'tier1'
    });
    setError(null);
  };

  const createUser = async () => {
    try {
      const auth = getAuth();
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Add user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        tier: formData.tier,
        capabilities: TIER_INFO[formData.tier].capabilities,
        createdAt: new Date()
      });

      await fetchUsers();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser.uid);
      const updateData: any = {
        name: formData.name,
        role: formData.role,
        tier: formData.tier,
        capabilities: TIER_INFO[formData.tier].capabilities,
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

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete from Firebase Auth
      const auth = getAuth();
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      await fetchUsers();
      setError(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async () => {
    if (selectedUser) {
      await updateUser();
    } else {
      await createUser();
    }
  };

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
    <Box>
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
                    label={user.role === 'admin' ? 'Admin' : 'User'}
                    color={user.role === 'admin' ? 'primary' : 'default'}
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
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select
                value={formData.tier}
                label="Tier"
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as UserTier })}
              >
                {(Object.entries(TIER_INFO) as [UserTier, typeof TIER_INFO[UserTier]][]).map(([tier, info]) => (
                  <MenuItem key={tier} value={tier}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {info.icon}
                      <Box>
                        <Typography variant="body2">
                          {info.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {info.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
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
