import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from '@firebase/auth-types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { activityService } from '../services/activityService';

interface CustomUser {
  id: string;
  uid: string;
  email: string | null;
  name: string;
  role: string;
}

interface AuthContextType {
  user: CustomUser | null;
  firebaseUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // Track user activity
  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimeout);
      if (firebaseUser) {
        // Only set offline after inactivity, don't automatically set online
        idleTimeout = setTimeout(() => {
          if (firebaseUser) {
            activityService.setUserOffline(firebaseUser);
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    // Initial setup of idle timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      clearTimeout(idleTimeout);
    };
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email,
              name: userData.name || fbUser.displayName || fbUser.email || 'Unknown User',
              role: userData.role || 'user'
            });
          } else {
            // If user document doesn't exist in Firestore, create default user data
            setUser({
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email || 'Unknown User',
              role: 'user'
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email || 'Unknown User',
            role: 'user'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Set user as offline when the window is closed
    window.addEventListener('beforeunload', () => {
      if (firebaseUser) {
        activityService.setUserOffline(firebaseUser);
      }
    });

    return () => {
      unsubscribe();
      if (firebaseUser) {
        activityService.setUserOffline(firebaseUser);
      }
    };
  }, [auth]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        await activityService.setUserOffline(firebaseUser);
      }
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
