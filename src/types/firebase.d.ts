import { Timestamp } from 'firebase/firestore';

declare module 'firebase/firestore' {
  interface DocumentData {
    [field: string]: any;
  }

  interface QueryDocumentSnapshot<T = DocumentData> {
    data(): T;
    id: string;
    exists(): boolean;
    ref: any;
  }

  interface DocumentSnapshot<T = DocumentData> {
    data(): T | undefined;
    exists(): boolean;
    id: string;
    ref: any;
  }

  interface QuerySnapshot<T = DocumentData> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
  }

  interface FirestoreDataConverter<T> {
    toFirestore(modelObject: T): DocumentData;
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T;
  }

  interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
  }
}

declare module 'firebase/auth' {
  interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
    isAnonymous: boolean;
    tenantId: string | null;
    providerData: any[];
    metadata: {
      creationTime?: string;
      lastSignInTime?: string;
    };
  }
} 