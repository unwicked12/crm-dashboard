import { db } from '../firebase.js';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const ADMIN_EMAIL = 'ssebbane@cashsentinel.com';
const ADMIN_PASSWORD = 'Hoplala12@@'; // Replace with actual password

async function fixAdminUser() {
  try {
    console.log('Starting admin user fix...');
    const auth = getAuth();
    const functions = getFunctions();
    
    // First try to sign in as admin
    console.log('Attempting to sign in as admin...');
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const adminUid = userCredential.user.uid;
    
    console.log('Successfully signed in, creating/updating Firestore document...');
    
    // Create or update the admin document in Firestore
    const adminData = {
      email: ADMIN_EMAIL,
      name: 'Soufiane Sebbane',
      role: 'admin',
      tier: 'Compliance',
      scheduleType: 'standard',
      capabilities: {
        canDoCRM: true,
        canDoCalls: true,
        isIntern: false,
        canDoCompliance: true
      },
      status: 'active',
      id: adminUid,
      uid: adminUid,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', adminUid), adminData);
    
    // Set custom claims using Cloud Function
    const setCustomClaims = httpsCallable(functions, 'setCustomClaims');
    await setCustomClaims({ uid: adminUid, claims: { role: 'admin' } });
    
    console.log('Successfully fixed admin user permissions and custom claims');
  } catch (error) {
    console.error('Error fixing admin user:', error);
    throw error;
  }
}

fixAdminUser(); 