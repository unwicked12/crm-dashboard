import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from '@firebase/firestore-types';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  setHours,
} from 'date-fns';

interface User {
  uid: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  tier: 'tier1' | 'tier2' | 'tier3' | 'compliance';
}

interface Schedule {
  id?: string;
  userId: string;
  date: Date;
  shift: string;
  tasks: {
    morning: 'CALL' | 'CRM';
    afternoon: 'CALL' | 'CRM';
  };
}

// Constants for user IDs
const ADMIN_IDS = [
  'XOn7L0j3RyMuKpnnX2SqdyYbd6x2',
  'bVIsSaUWMSSLpnk335c3txdBbLq1',
  'CKN9y4XK1qeTms3TaNwLPcc5xSz1',
  '3VCA6Vtpw8SlQ370urskih5Qg9w2',
];

const SEBASTIEN_CESARI_ID = 'hLTTflNRxkP3orYXynaIDJCkaEC3';
const WEDNESDAY_EARLY_START = '08:00';
const REGULAR_START = '09:00';
const REGULAR_END = '18:00';

export const scheduleService = {
  async getUsers() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    // Create a Map to ensure unique users by UID
    const userMap = new Map<string, User>();
    
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      // Skip if no ID or if it's a test user
      if (!doc.id || doc.id.includes('agent')) return;
      
      // Only add if not already in map
      if (!userMap.has(doc.id)) {
        userMap.set(doc.id, {
          uid: doc.id,
          ...data,
          name: data.name || data.email || 'Unknown User',
          role: ADMIN_IDS.includes(doc.id) ? 'admin' : 'user',
          tier: data.tier || 'tier2'
        } as User);
      }
    });

    const users = Array.from(userMap.values());
    console.log('Fetched unique users:', users);
    return users;
  },

  async generateSchedule(startDate: Date, endDate: Date) {
    try {
      const users = await this.getUsers();
      const regularUsers = users.filter(
        (user: User) => !ADMIN_IDS.includes(user.uid)
      );

      await this.clearAllSchedules();

      const schedules: Schedule[] = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const daySchedules = this.generateDaySchedule(currentDate, regularUsers as User[]);
        schedules.push(...daySchedules);
        currentDate = addDays(currentDate, 1);
      }

      await this.saveSchedules(schedules);
      return schedules;
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  },

  generateDaySchedule(date: Date, users: User[]): Schedule[] {
    const daySchedules: Schedule[] = [];
    const dayOfWeek = format(date, 'EEEE');
    const scheduledUsers = new Set<string>();

    if (dayOfWeek === 'Sunday') return daySchedules;

    // Ensure users are in only one tier list
    const tier3Users = users.filter(
      (user) => user.tier === 'tier3' && user.uid !== SEBASTIEN_CESARI_ID
    );
    const tier2Users = users.filter(
      (user) => user.tier === 'tier2' && !tier3Users.some(t3 => t3.uid === user.uid)
    );
    const tier1Users = users.filter(
      (user) => user.tier === 'tier1' && 
      !tier3Users.some(t3 => t3.uid === user.uid) &&
      !tier2Users.some(t2 => t2.uid === user.uid)
    );

    // Schedule Sebastien on all days except Sunday and Monday
    if (dayOfWeek !== 'Monday' && !scheduledUsers.has(SEBASTIEN_CESARI_ID)) {
      daySchedules.push({
        userId: SEBASTIEN_CESARI_ID,
        date: new Date(date),
        shift: `${REGULAR_START}-${REGULAR_END}`,
        tasks: { morning: 'CALL', afternoon: 'CRM' },
      });
      scheduledUsers.add(SEBASTIEN_CESARI_ID);
    }

    const addUserToSchedule = (user: User, morningTask: 'CALL' | 'CRM', afternoonTask: 'CALL' | 'CRM') => {
      if (!scheduledUsers.has(user.uid)) {
        daySchedules.push({
          userId: user.uid,
          date: new Date(date),
          shift: dayOfWeek === 'Wednesday' && user.tier === 'tier3' 
            ? `${WEDNESDAY_EARLY_START}-${REGULAR_END}`
            : `${REGULAR_START}-${REGULAR_END}`,
          tasks: { morning: morningTask, afternoon: afternoonTask },
        });
        scheduledUsers.add(user.uid);
      }
    };

    if (dayOfWeek === 'Saturday') {
      // Only schedule one tier3 user on Saturday
      if (tier3Users.length > 0 && !scheduledUsers.has(tier3Users[0].uid)) {
        addUserToSchedule(tier3Users[0], 'CALL', 'CRM');
      }
    } else {
      // Schedule each user exactly once
      tier3Users.forEach((user) => {
        if (!scheduledUsers.has(user.uid)) {
          addUserToSchedule(user, 'CRM', 'CALL');
        }
      });

      tier2Users.forEach((user) => {
        if (!scheduledUsers.has(user.uid)) {
          addUserToSchedule(user, 'CALL', 'CRM');
        }
      });

      tier1Users.forEach((user) => {
        if (!scheduledUsers.has(user.uid)) {
          addUserToSchedule(user, 'CRM', 'CRM');
        }
      });
    }

    return daySchedules;
  },

  async saveSchedules(schedules: Schedule[]) {
    const batch = writeBatch(db);

    schedules.forEach((schedule) => {
      const scheduleRef = doc(collection(db, 'schedules'));
      batch.set(scheduleRef, {
        ...schedule,
        date: Timestamp.fromDate(schedule.date),
      });
    });

    await batch.commit();
  },

  async clearAllSchedules() {
    const schedulesRef = collection(db, 'schedules');
    const snapshot = await getDocs(schedulesRef);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
  },
};