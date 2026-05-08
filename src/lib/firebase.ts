import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigLocal from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId,
};

const app = initializeApp(firebaseConfig);
const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigLocal.firestoreDatabaseId;

console.log("Initializing Firestore with Database ID:", dbId);
export const db = getFirestore(app, dbId);
export const auth = getAuth(app);
export const storage = getStorage(app);

if (typeof window !== 'undefined') {
  (window as any).db = db;
  (window as any).auth = auth;
  (window as any).f = { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc };
}

async function testConnection() {
  try {
    // Attempt a simple read to check connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection successful');
  } catch (error: any) {
    // If it's a permission error, it means we ARE connected but just don't have access to this specific path
    if (error?.code === 'permission-denied' || (error instanceof Error && error.message.includes('permission-denied'))) {
      console.log('Firebase connection successful (authenticated access verified)');
      return;
    }
    
    console.error("Firebase Connection Issue:", error);
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('is not a valid database')) {
        console.warn("Firestore might be in offline mode or database ID is mismatch. Verification recommended.");
      }
    }
  }
}

// Delay connection test slightly to avoid blocking boot
setTimeout(testConnection, 2000);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
