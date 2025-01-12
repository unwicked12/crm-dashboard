import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  PhoneInTalk as CallIcon,
  Computer as CRMIcon,
  School as InternIcon,
  Info as InfoIcon,
  Security as ComplianceIcon,
} from '@mui/icons-material';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import type { QueryDocumentSnapshot } from '@firebase/firestore-types';

interface TierCapabilities {
  canDoCRM: boolean;
  canDoCalls: boolean;
  isIntern: boolean;
  canDoCompliance: boolean;
}

interface TierSettings {
  label: string;
  description: string;
  capabilities: TierCapabilities;
  color: string;
}

interface TierData {
  [key: string]: TierSettings;
}

const defaultTiers: TierData = {
  tier1: {
    label: 'Tier 1 (Intern)',
    description: 'Training phase - Learning the basics',
    color: 'info',
    capabilities: {
      canDoCRM: false,
      canDoCalls: false,
      isIntern: true,
      canDoCompliance: false,
    },
  },
  tier2: {
    label: 'Tier 2 (CRM)',
    description: 'Can handle CRM tasks',
    color: 'success',
    capabilities: {
      canDoCRM: true,
      canDoCalls: false,
      isIntern: false,
      canDoCompliance: false,
    },
  },
  tier3: {
    label: 'Tier 3 (Full Access)',
    description: 'Can handle both CRM and Calls',
    color: 'primary',
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
    capabilities: {
      canDoCRM: true,
      canDoCalls: true,
      isIntern: false,
      canDoCompliance: true,
    },
  },
};

const UserTierManagement: React.FC = () => {
  const [tiers, setTiers] = useState<TierData>(defaultTiers);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TierSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userCounts, setUserCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchTiers();
    fetchUserCounts();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const tiersDoc = await getDoc(doc(db, 'settings', 'tiers'));
      if (tiersDoc.exists()) {
        setTiers(tiersDoc.data() as TierData);
      } else {
        // Initialize with default tiers if not exists
        await setDoc(doc(db, 'settings', 'tiers'), defaultTiers);
      }
    } catch (err) {
      console.error('Error fetching tiers:', err);
      setError('Failed to load tier settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCounts = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const counts: { [key: string]: number } = {};
      
      usersSnapshot.forEach((doc: QueryDocumentSnapshot) => {
        const tier = doc.data().tier || 'tier1';
        counts[tier] = (counts[tier] || 0) + 1;
      });
      
      setUserCounts(counts);
    } catch (err) {
      console.error('Error fetching user counts:', err);
    }
  };

  const handleEditTier = (tierId: string) => {
    setEditingTier(tierId);
    setEditForm({ ...tiers[tierId] });
  };

  const handleSaveTier = async () => {
    if (!editingTier || !editForm) return;

    try {
      const newTiers = {
        ...tiers,
        [editingTier]: editForm,
      };
      
      await setDoc(doc(db, 'settings', 'tiers'), newTiers);
      setTiers(newTiers);
      setSuccess('Tier settings updated successfully');
      setEditingTier(null);
      setEditForm(null);
      
      // Refresh user counts as capabilities might have changed
      await fetchUserCounts();
    } catch (err) {
      console.error('Error saving tier:', err);
      setError('Failed to save tier settings');
    }
  };

  const handleCapabilityChange = (capability: keyof TierCapabilities) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      capabilities: {
        ...editForm.capabilities,
        [capability]: !editForm.capabilities[capability],
      },
    });
  };

  const renderTierCard = (tierId: string, tierInfo: TierSettings) => {
    const isEditing = editingTier === tierId;
    const currentInfo = isEditing ? editForm! : tierInfo;

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Stack spacing={1}>
                {isEditing ? (
                  <TextField
                    label="Label"
                    value={currentInfo.label}
                    onChange={(e) => setEditForm({ ...editForm!, label: e.target.value })}
                    size="small"
                    fullWidth
                  />
                ) : (
                  <Typography variant="h6">{currentInfo.label}</Typography>
                )}
                {isEditing ? (
                  <TextField
                    label="Description"
                    value={currentInfo.description}
                    onChange={(e) => setEditForm({ ...editForm!, description: e.target.value })}
                    size="small"
                    fullWidth
                    multiline
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {currentInfo.description}
                  </Typography>
                )}
              </Stack>
              {!isEditing ? (
                <IconButton size="small" onClick={() => handleEditTier(tierId)}>
                  <EditIcon />
                </IconButton>
              ) : (
                <IconButton size="small" color="primary" onClick={handleSaveTier}>
                  <SaveIcon />
                </IconButton>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Capabilities:
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentInfo.capabilities.canDoCalls}
                      onChange={() => isEditing && handleCapabilityChange('canDoCalls')}
                      disabled={!isEditing}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CallIcon fontSize="small" />
                      <Typography>Handle Calls</Typography>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentInfo.capabilities.canDoCRM}
                      onChange={() => isEditing && handleCapabilityChange('canDoCRM')}
                      disabled={!isEditing}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CRMIcon fontSize="small" />
                      <Typography>Use CRM</Typography>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentInfo.capabilities.canDoCompliance}
                      onChange={() => isEditing && handleCapabilityChange('canDoCompliance')}
                      disabled={!isEditing}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ComplianceIcon fontSize="small" />
                      <Typography>Compliance Tasks</Typography>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentInfo.capabilities.isIntern}
                      onChange={() => isEditing && handleCapabilityChange('isIntern')}
                      disabled={!isEditing}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <InternIcon fontSize="small" />
                      <Typography>Intern Status</Typography>
                    </Stack>
                  }
                />
              </Stack>
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">
                  Users in this tier:
                </Typography>
                <Typography variant="h4" color={tierInfo.color}>
                  {userCounts[tierId] || 0}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            User Tier Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure tier capabilities and permissions. Changes will affect all users in the respective tiers.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {Object.entries(tiers).map(([tierId, tierInfo]) => (
            <Grid item xs={12} sm={6} md={3} key={tierId}>
              {renderTierCard(tierId, tierInfo)}
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Box>
  );
};

export default UserTierManagement; 