// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DocumentData, QueryDocumentSnapshot } from '@firebase/firestore-types';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  setHours,
} from 'date-fns';
import { userService } from './userService';

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
  status: string;
  tasks: {
    morning: 'CALL' | 'CRM';
    afternoon: 'CALL' | 'CRM';
  };
}

interface Holiday {
  userId: string;
  startDate: Date;
  endDate: Date;
}

// Constants for user IDs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ADMIN_IDS = [
  'XOn7L0j3RyMuKpnnX2SqdyYbd6x2',
  'bVIsSaUWMSSLpnk335c3txdBbLq1',
  'CKN9y4XK1qeTms3TaNwLPcc5xSz1',
  '3VCA6Vtpw8SlQ370urskih5Qg9w2',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SEBASTIEN_CESARI_ID = 'hLTTflNRxkP3orYXynaIDJCkaEC3';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WEDNESDAY_EARLY_START = '08:00';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const REGULAR_START = '09:00';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const REGULAR_END = '18:00';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // Removed console.log
    return users;
  },

  async getHolidays(startDate: Date, endDate: Date): Promise<Holiday[]> {
    // Implementation of getHolidays method
    // This is a placeholder and should be implemented based on your data structure
    return [];
  },

  async generateSchedule(startDate: Date, endDate: Date) {
    try {
      const users = await this.getUsers();
      const regularUsers = users.filter(
        (user: User) => !ADMIN_IDS.includes(user.uid)
      );
      
      // Get approved holidays for the date range
      const holidays = await this.getHolidays(startDate, endDate);

      await this.clearAllSchedules();

      const schedules: Schedule[] = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const daySchedules = await this.generateDaySchedule(
          currentDate, 
          regularUsers as User[], 
          holidays
        );
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

  // Check if a user is on holiday for a specific date
  isUserOnHoliday(userId: string, date: Date, holidays: Holiday[]): boolean {
    return holidays.some(holiday => 
      holiday.userId === userId && 
      date >= holiday.startDate && 
      date <= holiday.endDate
    );
  },

  // Check if a user is available for a specific Saturday
  async isUserAvailableForSaturday(userId: string, date: Date): Promise<boolean> {
    try {
      return await userService.getUserSaturdayAvailabilityForDate(userId, date);
    } catch (error) {
      console.error('Error checking Saturday availability:', error);
      // Default to not available if there's an error
      return false;
    }
  },

  async generateDaySchedule(date: Date, users: User[], holidays: Holiday[]): Promise<Schedule[]> {
    const daySchedules: Schedule[] = [];
    const dayOfWeek = format(date, 'EEEE');
    const scheduledUsers = new Set<string>();

    // Don't schedule anyone on Sunday
    if (dayOfWeek === 'Sunday') return daySchedules;

    // Filter out users who are on holiday
    const availableUsers = users.filter(user => 
      !this.isUserOnHoliday(user.uid, date, holidays)
    );

    // Ensure users are in only one tier list
    const tier3Users = availableUsers.filter(
      (user) => user.tier === 'tier3' && user.uid !== SEBASTIEN_CESARI_ID
    );
    const tier2Users = availableUsers.filter(
      (user) => user.tier === 'tier2' && !tier3Users.some(t3 => t3.uid === user.uid)
    );
    const tier1Users = availableUsers.filter(
      (user) => user.tier === 'tier1' && 
      !tier3Users.some(t3 => t3.uid === user.uid) &&
      !tier2Users.some(t2 => t2.uid === user.uid)
    );

    // Schedule Sebastien on all days except Sunday and Monday
    // Also check if Sebastien is on holiday
    if (dayOfWeek !== 'Monday' && 
        !scheduledUsers.has(SEBASTIEN_CESARI_ID) && 
        !this.isUserOnHoliday(SEBASTIEN_CESARI_ID, date, holidays)) {
      daySchedules.push({
        userId: SEBASTIEN_CESARI_ID,
        date: new Date(date),
        shift: `${REGULAR_START}-${REGULAR_END}`,
        status: 'pending',
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
          status: 'pending',
          tasks: { morning: morningTask, afternoon: afternoonTask },
        });
        scheduledUsers.add(user.uid);
      }
    };

    if (dayOfWeek === 'Saturday') {
      // For Saturdays, we need to check specific availability for this date
      const saturdayAvailableUsers: User[] = [];
      
      // Check each user's availability for this specific Saturday
      for (const user of [...tier3Users, ...tier2Users, ...tier1Users]) {
        const isAvailable = await this.isUserAvailableForSaturday(user.uid, date);
        if (isAvailable) {
          saturdayAvailableUsers.push(user);
        }
      }
      
      // If we have Saturday available users, schedule them
      if (saturdayAvailableUsers.length > 0) {
        // Prioritize tier3 users for Saturday
        const tier3SaturdayUsers = saturdayAvailableUsers.filter(user => user.tier === 'tier3');
        if (tier3SaturdayUsers.length > 0) {
          addUserToSchedule(tier3SaturdayUsers[0], 'CALL', 'CRM');
        } else if (saturdayAvailableUsers.length > 0) {
          // If no tier3 users are available, use any available user
          addUserToSchedule(saturdayAvailableUsers[0], 'CALL', 'CRM');
        }
      }
    } else {
      // Schedule each user exactly once for weekdays
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