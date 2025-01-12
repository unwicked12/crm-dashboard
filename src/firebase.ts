import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCMZ_efwucAWgxbcrmhV5kx8KozUHYrnow",
  authDomain: "cashsentinel-crm.firebaseapp.com",
  databaseURL: "https://cashsentinel-crm-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cashsentinel-crm",
  storageBucket: "cashsentinel-crm.firebasestorage.app",
  messagingSenderId: "400955548817",
  appId: "1:400955548817:web:86e0badd67196baa0dcb30",
  measurementId: "G-G625KQWMLX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
