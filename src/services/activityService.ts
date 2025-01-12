import { db } from '../firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { User } from '@firebase/auth-types';

export type UserStatus = 'checked-in' | 'checked-out' | 'lunch' | 'break';

const saveActivityLog = async (userId: string, status: UserStatus) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      status,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving activity log:', error);
  }
};

const setUserOnline = async (user: User) => {
  if (!user.uid) return;
  
  await setDoc(doc(db, 'monitoring', user.uid), {
    status: 'checked-in',
    lastAction: 'checked-in',
    lastActionTime: serverTimestamp(),
    userName: user.displayName || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.uid, 'checked-in');
};

const setUserOffline = async (user: User) => {
  if (!user.uid) return;
  
  await setDoc(doc(db, 'monitoring', user.uid), {
    status: 'checked-out',
    lastAction: 'checked-out',
    lastActionTime: serverTimestamp(),
    userName: user.displayName || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.uid, 'checked-out');
};

const setUserLunch = async (user: User) => {
  if (!user.uid) return;
  
  await setDoc(doc(db, 'monitoring', user.uid), {
    status: 'lunch',
    lastAction: 'lunch',
    lastActionTime: serverTimestamp(),
    userName: user.displayName || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.uid, 'lunch');
};

const setUserBreak = async (user: User) => {
  if (!user.uid) return;
  
  await setDoc(doc(db, 'monitoring', user.uid), {
    status: 'break',
    lastAction: 'break',
    lastActionTime: serverTimestamp(),
    userName: user.displayName || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.uid, 'break');
};

export const activityService = {
  setUserOnline,
  setUserOffline,
  setUserLunch,
  setUserBreak,
}; 