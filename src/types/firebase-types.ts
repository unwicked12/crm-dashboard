import type { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

export interface FirestoreDocument<T> {
  data(): T | undefined;
  exists(): boolean;
  id: string;
}

export interface FirestoreQueryDoc<T> {
  data(): T;
  id: string;
}

export interface FirestoreQueryResult<T> {
  docs: FirestoreQueryDoc<T>[];
}

export interface FirestoreTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

export type ActivityStatus = 'checked-in' | 'checked-out' | 'break' | 'lunch';

// Extended activity type for logs
export type ActivityLogType = 
  | 'checked-in' 
  | 'checked-out' 
  | 'break' 
  | 'lunch'
  | 'break-start' 
  | 'break-end' 
  | 'lunch-start' 
  | 'lunch-end';

export interface ActivityDocument {
  status: ActivityStatus;
  lastAction: string;
  lastActionTime: FirestoreTimestamp;
  userName: string;
  email: string;
  currentTask?: string;
}

export interface ActivityLog {
  id?: string;
  userId?: string;
  type: ActivityLogType;
  timestamp?: FirestoreTimestamp;
  createdAt?: string;
}

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
} 