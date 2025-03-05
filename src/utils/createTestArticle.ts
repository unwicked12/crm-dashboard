import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMZ_efwucAWgxbcrmhV5kx8KozUHYrnow",
  authDomain: "cashsentinel-crm.firebaseapp.com",
  databaseURL: "https://cashsentinel-crm-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cashsentinel-crm",
  storageBucket: "cashsentinel-crm.appspot.com",
  messagingSenderId: "400955548817",
  appId: "1:400955548817:web:86e0badd67196baa0dcb30",
  measurementId: "G-G625KQWMLX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials
const ADMIN_EMAIL = 'ssebbane@cashsentinel.com';
const ADMIN_PASSWORD = 'Hoplala12@@';

// Test article data
const testArticle = {
  title: 'Test Article for Approval Workflow',
  content: 'This is a test article to verify the approval workflow. It should be in a pending state until approved by an admin.',
  category: 'Support',
  tags: ['test', 'approval', 'workflow'],
  createdAt: new Date(),
  updatedAt: new Date(),
  authorId: '', // Will be set after authentication
  authorName: 'Test User',
  type: 'general',
  visibility: 'public',
  approvalStatus: 'pending',
  summary: 'A test article for the approval workflow'
};

// Function to create a test article
const createTestArticle = async () => {
  try {
    // Removed console.log
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;
    
    // Removed console.log
    
    // Set the author ID to the admin's UID
    testArticle.authorId = user.uid;
    
    // Convert dates to Firestore Timestamps
    const firestoreArticle = {
      ...testArticle,
      createdAt: Timestamp.fromDate(testArticle.createdAt),
      updatedAt: Timestamp.fromDate(testArticle.updatedAt)
    };
    
    // Removed console.log
    const docRef = await addDoc(collection(db, 'knowledgeBase'), firestoreArticle);
    
    // Removed console.log
    
    // Sign out
    await auth.signOut();
    // Removed console.log
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating test article:', error);
    throw error;
  }
};

// Execute the function
createTestArticle()
  .then(() => {
    // Removed console.log
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test article creation failed:', error);
    process.exit(1);
  }); 