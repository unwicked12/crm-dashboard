import { db } from '../firebase';
import { 
  collection, 
  query, 
  getDocs,
  doc,
  getDoc,
  where,
  orderBy,
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentSnapshot,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

export type UserTier = 'tier1' | 'tier2' | 'tier3' | 'compliance';
export type UserRole = 'admin' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  capabilities: {
    canDoCRM: boolean;
    canDoCalls: boolean;
    isIntern: boolean;
  };
  schedule?: {
    shift: string;
    tasks: {
      morning: 'CALL' | 'CRM';
      afternoon: 'CALL' | 'CRM';
    };
  };
}

export interface Schedule {
  id: string;
  userId: string;
  date: Date;
  shift: string;
  tasks: {
    morning: 'CALL' | 'CRM';
    afternoon: 'CALL' | 'CRM';
  };
}

interface FirestoreData {
  [key: string]: any;
}

interface UserUpdate {
  name?: string;
  email?: string;
  role?: UserRole;
  tier?: UserTier;
  capabilities?: {
    canDoCRM: boolean;
    canDoCalls: boolean;
    isIntern: boolean;
  };
  schedule?: {
    shift: string;
    tasks: {
      morning: 'CALL' | 'CRM';
      afternoon: 'CALL' | 'CRM';
    };
  };
}

const USERS_COLLECTION = 'users';
const SCHEDULES_COLLECTION = 'schedules';

// Helper function to determine user capabilities based on tier
const getUserCapabilities = (tier: UserTier) => {
  switch (tier) {
    case 'tier1':
      return {
        canDoCRM: false,
        canDoCalls: false,
        isIntern: true
      };
    case 'tier2':
      return {
        canDoCRM: true,
        canDoCalls: false,
        isIntern: false
      };
    case 'tier3':
      return {
        canDoCRM: true,
        canDoCalls: true,
        isIntern: false
      };
    case 'compliance':
      return {
        canDoCRM: false,
        canDoCalls: true,
        isIntern: false
      };
    default:
      return {
        canDoCRM: false,
        canDoCalls: false,
        isIntern: false
      };
  }
};

export const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: { id: string; data: () => FirestoreData }) => {
        const data = doc.data();
        const tier = data.tier as UserTier;
        return {
          id: doc.id,
          ...data,
          capabilities: getUserCapabilities(tier)
        } as User;
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (!userDoc.exists()) return null;
      
      const data = userDoc.data() as FirestoreData;
      const tier = data.tier as UserTier;
      return {
        id: userDoc.id,
        ...data,
        capabilities: getUserCapabilities(tier)
      } as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Create a new user
  createUser: async (user: Omit<User, 'id' | 'capabilities'>): Promise<User> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const capabilities = getUserCapabilities(user.tier);
      const docRef = await addDoc(usersRef, {
        ...user,
        capabilities
      });
      
      return {
        id: docRef.id,
        ...user,
        capabilities
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update a user
  updateUser: async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<void> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const updateData: UserUpdate = { ...updates };
      
      if (updates.tier) {
        updateData.capabilities = getUserCapabilities(updates.tier);
      }
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Get schedules for a specific date range
  getSchedules: async (startDate: Date, endDate: Date): Promise<Schedule[]> => {
    try {
      const schedulesRef = collection(db, SCHEDULES_COLLECTION);
      const q = query(
        schedulesRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: { id: string; data: () => FirestoreData & { date: { toDate: () => Date } } }) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate()
        } as Schedule;
      });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  },

  // Create a new schedule
  createSchedule: async (schedule: Omit<Schedule, 'id'>): Promise<Schedule> => {
    try {
      const schedulesRef = collection(db, SCHEDULES_COLLECTION);
      const docRef = await addDoc(schedulesRef, {
        ...schedule,
        date: Timestamp.fromDate(schedule.date)
      });
      
      return {
        id: docRef.id,
        ...schedule
      };
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  // Update a schedule
  updateSchedule: async (scheduleId: string, schedule: Partial<Schedule>): Promise<void> => {
    try {
      const scheduleRef = doc(db, SCHEDULES_COLLECTION, scheduleId);
      const updateData = {
        ...schedule,
        date: schedule.date ? Timestamp.fromDate(schedule.date) : undefined
      };
      await updateDoc(scheduleRef, updateData);
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  },

  // Delete a schedule
  deleteSchedule: async (scheduleId: string): Promise<void> => {
    try {
      const scheduleRef = doc(db, SCHEDULES_COLLECTION, scheduleId);
      await deleteDoc(scheduleRef);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }
}; 