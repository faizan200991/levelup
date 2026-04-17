// Firebase config placeholder. Replace with your own config when ready.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'demo',
  authDomain: 'demo',
  projectId: 'demo',
  storageBucket: 'demo',
  messagingSenderId: 'demo',
  appId: 'demo',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };