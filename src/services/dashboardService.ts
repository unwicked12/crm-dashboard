// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UserStatus } from './activityService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAuth } from 'firebase/auth';

export interface DashboardStats {
  pendingRequests: number;
  activeAgents: number;
  plannedHolidays: number;
  specialRequests: number;
}

interface BaseData {
  agentId: string;
  agentName?: string;
}

interface RequestData extends BaseData {
  type: 'holiday' | 'special';
  status: 'pending' | 'approved' | 'rejected';
  startDate: { seconds: number; nanoseconds: number };
  endDate: { seconds: number; nanoseconds: number };
  reason?: string;
}

interface MonitoringData extends BaseData {
  status: UserStatus;
}

interface FirebaseDoc {
  data(): any;
  id: string;
}

interface UserData {
  displayName: string;
  email: string;
  role: string;
}

function isRequestData(data: any): data is RequestData {
  return (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    (data.type === 'holiday' || data.type === 'special') &&
    'status' in data &&
    typeof data.status === 'string' &&
    'startDate' in data &&
    typeof data.startDate === 'object' &&
    'seconds' in data.startDate
  );
}

function isMonitoringData(data: any): data is MonitoringData {
  return (
    data &&
    typeof data === 'object' &&
    'status' in data &&
    typeof data.status === 'string'
  );
}

function timestampToDate(timestamp: { seconds: number; nanoseconds: number }): Date {
  return new Date(timestamp.seconds * 1000);
}

async function enrichRequestWithUserData(request: RequestData): Promise<RequestData> {
  try {
    const userDoc = await getDoc(doc(db, 'users', request.agentId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      return {
        ...request,
        agentName: userData.displayName || userData.email
      };
    }
    return request;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return request;
  }
}

async function enrichMonitoringWithUserData(data: MonitoringData): Promise<MonitoringData> {
  try {
    const userDoc = await getDoc(doc(db, 'users', data.agentId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      return {
        ...data,
        agentName: userData.displayName || userData.email
      };
    }
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return data;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      // Removed console.log
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all leave requests
      const leaveRequestsQuery = query(collection(db, 'requests'));
      const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
      const allRequests = await Promise.all(
        leaveRequestsSnapshot.docs
          .map((doc: FirebaseDoc) => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(isRequestData)
          .map(enrichRequestWithUserData)
      );

      // Removed console.log

      // Calculate stats from the filtered data
      const currentDate = new Date();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const stats = {
        pendingRequests: allRequests.filter((req: RequestData) => req.status === 'pending').length,
        activeAgents: 0, // Will be updated below
        plannedHolidays: allRequests.filter((req: RequestData) => 
          req.status === 'approved' && 
          timestampToDate(req.startDate) >= currentDate
        ).length,
        specialRequests: allRequests.filter((req: RequestData) => req.type === 'special').length
      };

      // Get active agents (checked-in status)
      const monitoringQuery = query(
        collection(db, 'monitoring'),
        where('status', 'in', ['available', 'checked-in'])
      );
      const monitoringSnapshot = await getDocs(monitoringQuery);
      const monitoringData = await Promise.all(
        monitoringSnapshot.docs
          .map((doc: FirebaseDoc) => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(isMonitoringData)
          .map(enrichMonitoringWithUserData)
      );

      // Removed console.log
      stats.activeAgents = monitoringData.length;

      // Removed console.log
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        pendingRequests: 0,
        activeAgents: 0,
        plannedHolidays: 0,
        specialRequests: 0
      };
    }
  },

  subscribeToStats: (callback: (stats: DashboardStats) => void) => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unsubscribers: (() => void)[] = [];

    // Monitor leave requests collection
    const requestsUnsubscribe = onSnapshot(
      collection(db, 'requests'),
      async () => {
        // Removed console.log
        const stats = await dashboardService.getStats();
        callback(stats);
      },
      (error: unknown) => {
        console.error('Error in requests subscription:', error);
      }
    );
    unsubscribers.push(requestsUnsubscribe);

    // Monitor active agents
    const monitoringUnsubscribe = onSnapshot(
      collection(db, 'monitoring'),
      async () => {
        // Removed console.log
        const stats = await dashboardService.getStats();
        callback(stats);
      },
      (error: unknown) => {
        console.error('Error in monitoring subscription:', error);
      }
    );
    unsubscribers.push(monitoringUnsubscribe);

    // Initial fetch
    // Removed console.log
    dashboardService.getStats().then(callback);

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
};