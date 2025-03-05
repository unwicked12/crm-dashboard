// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/user';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import logoImage from '../logo.png';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Login: React.FC = () => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const location = useLocation();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { login } = useAuth();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [email, setEmail] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [password, setPassword] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPassword, setShowPassword] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFirstUser, setIsFirstUser] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isChecking, setIsChecking] = useState(true);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        // Removed console.log
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const isFirst = snapshot.empty;
        // Removed console.log
        setIsFirstUser(isFirst);
      } catch (error) {
        console.error('[Login] Error checking first user:', error);
        setError('Error checking system status. Please try again.');
      } finally {
        setIsChecking(false);
      }
    };
    checkFirstUser();
  }, []);

  const validateInputs = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createAdminUser = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      setError('');

      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const userRef = doc(db, 'users', newUser.uid);
      const userData = {
        uid: newUser.uid,
        email: email,
        name: 'Admin',
        role: 'admin',
        tier: 'tier3',
        scheduleType: 'standard',
        capabilities: {
          canDoCRM: true,
          canDoCalls: true,
          isIntern: false,
          canDoCompliance: true
        },
        createdAt: serverTimestamp()
      };
      
      await setDoc(userRef, userData);
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[Login] Error creating admin user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to create admin account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      setLoading(true);
      setError('');

      if (isFirstUser) {
        await createAdminUser();
      } else {
        await login(email, password);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from);
      }
    } catch (error: any) {
      console.error('[Login] Login error:', error);
      setError(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Box 
            sx={{ 
              mb: 5,  
              width: '100%',
              height: 150,  
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <img 
              src={logoImage}
              alt="Logo" 
              style={{ 
                width: '100%',  
                height: 'auto',
                objectFit: 'contain',
              }} 
            />
          </Box>

          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            {isFirstUser ? 'Create Admin Account' : 'Sign in to Dashboard'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          {isFirstUser && (
            <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
              Welcome! Please create your admin account to get started.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              disabled={loading}
              error={!!error && error.toLowerCase().includes('email')}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete={isFirstUser ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              disabled={loading}
              error={!!error && error.toLowerCase().includes('password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: '#00B388',
                '&:hover': {
                  bgcolor: '#008F6B',
                },
                height: 48,
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isFirstUser ? 'Create Admin Account' : 'Sign In'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;