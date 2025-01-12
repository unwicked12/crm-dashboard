import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'admin@example.com';
const password = 'admin123';

async function createAdminUser() {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Add user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: 'admin',
      name: 'Admin User',
      createdAt: new Date(),
    });

    console.log('Admin user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 