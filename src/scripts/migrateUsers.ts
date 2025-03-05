import { db } from '../firebase.js';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface UserData {
  id?: string;
  uid?: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'user';
  tier?: string;
  scheduleType?: 'standard' | 'short' | 'nine';
  capabilities?: {
    canDoCRM: boolean;
    canDoCalls: boolean;
    isIntern: boolean;
    canDoCompliance: boolean;
  };
  status?: 'active' | 'inactive';
  createdAt?: Date;
}

const getTierCapabilities = (tier: string = 'tier1') => ({
  canDoCRM: tier === 'tier2' || tier === 'tier3',
  canDoCalls: tier === 'tier3',
  isIntern: tier === 'tier1',
  canDoCompliance: tier === 'compliance'
});

export const migrateUsers = async () => {
  try {
    // Removed console.log
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const auth = getAuth();
    
    let migratedCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const userDoc of snapshot.docs) {
      try {
        const userData = userDoc.data() as UserData;
        const docId = userDoc.id;
        
        // Skip if user is already properly structured
        if (userData.id && userData.uid && userData.status && userData.capabilities) {
          // Removed console.log
          continue;
        }

        // Prepare updated user data
        const updatedData: Partial<UserData> = {
          id: docId,
          uid: docId,
          status: 'active',
          capabilities: getTierCapabilities(userData.tier),
          scheduleType: userData.scheduleType || 'standard',
        };

        // Update the document
        await updateDoc(doc(db, 'users', docId), updatedData);
        // Removed console.log
        migratedCount++;
      } catch (error: any) {
        console.error(`Error migrating user ${userDoc.id}:`, error);
        errorCount++;
        errors.push({ id: userDoc.id, error: error.message });
      }
    }

    // Removed console.log
    // Removed console.log
    // Removed console.log
    // Removed console.log
    
    if (errors.length > 0) {
      // Removed console.log
      errors.forEach(({ id, error }) => {
        // Removed console.log
      });
    }

    return {
      total: snapshot.docs.length,
      migrated: migratedCount,
      errors: errorCount,
      errorDetails: errors
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}; 