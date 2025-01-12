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
import { UserStatus } from './activityService';
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

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      console.log('Fetching dashboard stats...');
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all leave requests
      const leaveRequestsQuery = query(collection(db, 'leaveRequests'));
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

      console.log('All leave requests:', allRequests);

      // Calculate stats from the filtered data
      const currentDate = new Date();
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

      console.log('Monitoring data:', monitoringData);
      stats.activeAgents = monitoringData.length;

      console.log('Final calculated stats:', stats);
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
    const unsubscribers: (() => void)[] = [];

    // Monitor leave requests collection
    const requestsUnsubscribe = onSnapshot(
      collection(db, 'leaveRequests'),
      async () => {
        console.log('Leave requests updated, recalculating stats...');
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
        console.log('Monitoring updated, recalculating stats...');
        const stats = await dashboardService.getStats();
        callback(stats);
      },
      (error: unknown) => {
        console.error('Error in monitoring subscription:', error);
      }
    );
    unsubscribers.push(monitoringUnsubscribe);

    // Initial fetch
    console.log('Starting initial stats fetch...');
    dashboardService.getStats().then(callback);

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
}; 