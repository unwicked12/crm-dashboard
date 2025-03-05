import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types/user';
import { FirebaseAuthUser } from '../types/firebase-types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    // Removed console.log
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
      try {
        // Removed console.log
        if (firebaseUser) {
          // Removed console.log
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            // Removed console.log);
            const userData = userDoc.data() as Omit<User, 'id'>;
            const userWithId = {
              id: userDoc.id,
              ...userData
            };
            // Removed console.log
            setUser(userWithId);
          } else {
            console.warn('[AuthContext] No Firestore document found for user');
            await firebaseSignOut(auth);
            setUser(null);
          }
        } else {
          // Removed console.log
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error processing auth state change:', error);
        setUser(null);
      } finally {
        // Removed console.log
        setLoading(false);
      }
    });

    return () => {
      // Removed console.log
      unsubscribe();
    };
  }, [auth]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // Removed console.log
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Removed console.log
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        console.error('[AuthContext] No Firestore document found after login');
        throw new Error('User document not found in Firestore');
      }
      
      const userData = userDoc.data() as Omit<User, 'id'>;
      const user: User = {
        id: userDoc.id,
        ...userData
      };
      
      // Removed console.log
      setUser(user);
      return user;
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      if (error.code === 'auth/invalid-login-credentials') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later');
      } else {
        throw new Error('Failed to login. Please try again');
      }
    }
  };

  const signOut = async () => {
    try {
      // Removed console.log
      await firebaseSignOut(auth);
      setUser(null);
      // Removed console.log
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  };

  const value = {
    user,
    loading,
    login,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
