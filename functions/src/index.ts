import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface NewUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'hr' | 'user';
  tier: string;
  scheduleType: 'standard' | 'short' | 'nine';
  capabilities: {
    canDoCRM: boolean;
    canDoCalls: boolean;
    isIntern: boolean;
    canDoCompliance: boolean;
  };
  createdAt: FirebaseFirestore.Timestamp;
}

export const setCustomClaims = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set custom claims'
    );
  }

  const { uid, claims } = data;
  
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    return { success: true };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError('internal', 'Error setting custom claims');
  }
});

export const createUser = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data() as NewUserData;
    const password = userData.password;

    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: userData.email,
        password: password,
        displayName: userData.name,
      });

      // Set custom claims based on user role
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: userData.role
      });

      // Update the Firestore document with the user's UID and remove the password
      const userRef = snap.ref;
      const updatedData = {
        ...userData,
        uid: userRecord.uid,
      };
      delete (updatedData as any).password;  // Remove password from Firestore

      await userRef.set(updatedData, { merge: true });
      
      return { success: true };
    } catch (error) {
      // If user creation fails, delete the Firestore document
      await snap.ref.delete();
      console.error('Error creating user:', error);
      throw error;
    }
  });

export const deleteUser = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;

    try {
      // Delete the user from Firebase Auth
      await admin.auth().deleteUser(userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user from Firebase Auth:', error);
      throw error;
    }
  });

export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({
    message: 'Hello from Firebase!'
  });
});
