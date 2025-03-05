// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db } from '../firebase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { QueryDocumentSnapshot, DocumentData } from '@firebase/firestore-types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy,
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAuth } from 'firebase/auth';

export interface Request {
  id?: string;
  userId: string;
  agentId: string;
  title?: string;
  description?: string;
  type: 'holiday' | 'special' | 'saturday_availability';
  startDate?: Date;
  endDate?: Date;
  date?: Date;
  month?: number;
  year?: number;
  newAvailability?: boolean;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const COLLECTION_NAME = 'requests';

// Create a type-safe converter
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const requestConverter = {
  toFirestore(request: Request) {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = request;
    return {
      ...data,
      agentId: data.agentId || data.userId,
      userId: data.userId || data.agentId,
      startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
      endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
      date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
      createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : serverTimestamp(),
      updatedAt: data.updatedAt ? Timestamp.fromDate(data.updatedAt) : serverTimestamp(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Request {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId || data.agentId,
      agentId: data.agentId || data.userId,
      title: data.title,
      description: data.description,
      type: data.type,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : undefined,
      date: data.date instanceof Timestamp ? data.date.toDate() : data.date ? new Date(data.date) : undefined,
      month: data.month,
      year: data.year,
      newAvailability: data.newAvailability,
      reason: data.reason,
      status: data.status || 'pending',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    };
  },
};

const ensureAuth = () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }
  return auth.currentUser;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const requestService = {
  // Create a new request
  createRequest: async (request: Partial<Request>): Promise<Request> => {
    try {
      const user = ensureAuth();
      const requestsRef = collection(db, COLLECTION_NAME).withConverter(requestConverter);
      
      const now = new Date();
      
      // Debug logs
      console.log('Creating request with data:', JSON.stringify(request, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }, 2));
      
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const newRequest: Request = {
        ...request,
        userId: request.userId || user.uid,
        agentId: request.agentId || user.uid,
        type: request.type || 'holiday',
        reason: request.reason || '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      } as Request;
      
      // Debug logs
      console.log('Processed request data:', JSON.stringify(newRequest, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }, 2));
      
      const docRef = await addDoc(requestsRef, newRequest);
      return {
        ...newRequest,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  // Get requests for a user
  getUserRequests: async (userId: string): Promise<Request[]> => {
    try {
      console.log('Getting requests for user:', userId);
      const requestsRef = collection(db, COLLECTION_NAME).withConverter(requestConverter);
      
      // Query for both userId and agentId
      const userIdQuery = query(
        requestsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const agentIdQuery = query(
        requestsRef,
        where('agentId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      // Get results from both queries
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [userIdSnapshot, agentIdSnapshot] = await Promise.all([
        getDocs(userIdQuery),
        getDocs(agentIdQuery)
      ]);
      
      // Combine and deduplicate results
      const requests = new Map<string, Request>();
      
      userIdSnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        requests.set(doc.id, requestConverter.fromFirestore(doc));
      });
      
      agentIdSnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        requests.set(doc.id, requestConverter.fromFirestore(doc));
      });
      
      const combinedRequests = Array.from(requests.values());
      console.log('Retrieved requests:', combinedRequests);
      
      return combinedRequests;
    } catch (error) {
      console.error('Error getting user requests:', error);
      throw error;
    }
  },

  // Get all requests (for admin)
  getAllRequests: async (): Promise<Request[]> => {
    try {
      const user = ensureAuth();
      const requestsRef = collection(db, COLLECTION_NAME).withConverter(requestConverter);
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => requestConverter.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting all requests:', error);
      throw error;
    }
  },

  // Get holiday requests with optional status filter
  getHolidayRequests: async (status?: 'pending' | 'approved' | 'rejected'): Promise<Request[]> => {
    try {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = ensureAuth();
      const requestsRef = collection(db, COLLECTION_NAME).withConverter(requestConverter);
      
      let q;
      if (status) {
        q = query(
          requestsRef,
          where('type', '==', 'holiday'),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          requestsRef,
          where('type', '==', 'holiday'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => requestConverter.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting holiday requests:', error);
      throw error;
    }
  },

  // Get Saturday availability requests with optional status filter
  getSaturdayAvailabilityRequests: async (status?: 'pending' | 'approved' | 'rejected'): Promise<Request[]> => {
    try {
      const user = ensureAuth();
      const requestsRef = collection(db, COLLECTION_NAME).withConverter(requestConverter);
      
      let q;
      if (status) {
        q = query(
          requestsRef,
          where('type', '==', 'saturday_availability'),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          requestsRef,
          where('type', '==', 'saturday_availability'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => requestConverter.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting Saturday availability requests:', error);
      throw error;
    }
  },

  // Update request status
  updateRequestStatus: async (requestId: string, status: Request['status']): Promise<void> => {
    try {
      const user = ensureAuth();
      const requestRef = doc(db, COLLECTION_NAME, requestId);
      
      await updateDoc(requestRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  },

  // Delete a request
  deleteRequest: async (requestId: string): Promise<void> => {
    try {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = ensureAuth();
      const requestRef = doc(db, COLLECTION_NAME, requestId);
      await deleteDoc(requestRef);
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  },
};