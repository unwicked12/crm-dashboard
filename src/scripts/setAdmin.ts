import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

// Replace this with your Firebase user ID
const USER_ID = 'YOUR_USER_ID';

async function setUserAsAdmin() {
  try {
    await setDoc(doc(db, 'users', USER_ID), {
      role: 'admin',
      name: 'Admin User',
      updatedAt: new Date()
    }, { merge: true });
    console.log('Successfully set user as admin');
  } catch (error) {
    console.error('Error setting user as admin:', error);
  }
} 