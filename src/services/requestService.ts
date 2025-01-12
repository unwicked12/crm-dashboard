import { db } from '../firebase';
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
import { getAuth } from 'firebase/auth';

export interface Request {
  id?: string;
  userId: string;
  agentId: string;
  type: 'holiday' | 'special';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION_NAME = 'leaveRequests';

// Create a type-safe converter
const requestConverter = {
  toFirestore(request: Request) {
    const { id, ...data } = request;
    return {
      ...data,
      agentId: data.userId,
      startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
      endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
      createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : serverTimestamp(),
      updatedAt: data.updatedAt ? Timestamp.fromDate(data.updatedAt) : serverTimestamp(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Request {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.agentId,
      agentId: data.agentId,
      type: data.type,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
      endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate),
      reason: data.reason,
      status: data.status,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
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

export const requestService = {
  // Create a new request
  createRequest: async (request: Omit<Request, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'agentId'>): Promise<Request> => {
    try {
      const user = ensureAuth();
      const requestsRef = collection(db, COLLECTION_NAME).withConverter(requestConverter);
      
      const now = new Date();
      const newRequest: Request = {
        ...request,
        agentId: user.uid,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      
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
      const user = ensureAuth();
      const requestsRef = collection(db, COLLECTION_NAME).withConverter(requestConverter);
      const q = query(
        requestsRef,
        where('agentId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => requestConverter.fromFirestore(doc));
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
      const user = ensureAuth();
      const requestRef = doc(db, COLLECTION_NAME, requestId);
      await deleteDoc(requestRef);
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  },
}; 