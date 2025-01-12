/// <reference types="@firebase/app-types" />
/// <reference types="@firebase/firestore-types" />
/// <reference types="@firebase/auth-types" />

declare module 'firebase/firestore' {
  import { Timestamp } from '@firebase/firestore-types';
  export { Timestamp };
}
