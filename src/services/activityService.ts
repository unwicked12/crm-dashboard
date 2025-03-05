import { db } from '../firebase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { doc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { User } from '../types/user';
import { ActivityLogType } from '../types/firebase-types';

export type UserStatus = 'checked-in' | 'checked-out' | 'lunch' | 'break';

interface ActivityLog {
  type: ActivityLogType;
  userId: string;
  details?: string;
  timestamp?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const saveActivityLog = async (userId: string, status: UserStatus) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      type: status,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving activity log:', error);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setUserOnline = async (user: User) => {
  if (!user.id) return;
  
  await setDoc(doc(db, 'monitoring', user.id), {
    status: 'checked-in',
    lastAction: 'checked-in',
    lastActionTime: serverTimestamp(),
    userName: user.name || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.id, 'checked-in');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setUserOffline = async (user: User) => {
  if (!user.id) return;
  
  await setDoc(doc(db, 'monitoring', user.id), {
    status: 'checked-out',
    lastAction: 'checked-out',
    lastActionTime: serverTimestamp(),
    userName: user.name || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.id, 'checked-out');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setUserLunch = async (user: User) => {
  if (!user.id) return;
  
  await setDoc(doc(db, 'monitoring', user.id), {
    status: 'lunch',
    lastAction: 'lunch',
    lastActionTime: serverTimestamp(),
    userName: user.name || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.id, 'lunch');
};

const setUserBreak = async (user: User) => {
  if (!user.id) return;
  
  await setDoc(doc(db, 'monitoring', user.id), {
    status: 'break',
    lastAction: 'break',
    lastActionTime: serverTimestamp(),
    userName: user.name || 'Unknown',
    email: user.email || '',
    updatedAt: new Date().toISOString(),
  });
  
  await saveActivityLog(user.id, 'break');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const activityService = {
  setUserOnline,
  setUserOffline,
  setUserLunch,
  setUserBreak,
  logActivity: async (activity: ActivityLog) => {
    const activityRef = collection(db, 'activityLogs');
    await addDoc(activityRef, {
      ...activity,
      timestamp: activity.timestamp || serverTimestamp()
    });
  },
  checkIn: async (userId: string) => {
    await setDoc(doc(db, 'activities', userId), {
      status: 'checked-in',
      lastAction: 'checked-in',
      lastActionTime: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
    
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      type: 'checked-in',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  },
  checkOut: async (userId: string) => {
    await setDoc(doc(db, 'activities', userId), {
      status: 'checked-out',
      lastAction: 'checked-out',
      lastActionTime: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
    
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      type: 'checked-out',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  },
  startBreak: async (userId: string) => {
    await setDoc(doc(db, 'activities', userId), {
      status: 'break',
      lastAction: 'break-start',
      lastActionTime: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
    
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      type: 'break-start',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  },
  endBreak: async (userId: string) => {
    await setDoc(doc(db, 'activities', userId), {
      status: 'checked-in',
      lastAction: 'break-end',
      lastActionTime: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
    
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      type: 'break-end',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  },
  startLunch: async (userId: string) => {
    await setDoc(doc(db, 'activities', userId), {
      status: 'lunch',
      lastAction: 'lunch-start',
      lastActionTime: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
    
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      type: 'lunch-start',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  },
  endLunch: async (userId: string) => {
    await setDoc(doc(db, 'activities', userId), {
      status: 'checked-in',
      lastAction: 'lunch-end',
      lastActionTime: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
    
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      type: 'lunch-end',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  }
};