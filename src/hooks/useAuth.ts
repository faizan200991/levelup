import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log("Auth state changed: User is logged in", firebaseUser.uid);
        
        const startSync = () => {
          if (unsubProfile) unsubProfile();
          unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            console.log("Profile snapshot received. Exists:", docSnap.exists());
            if (docSnap.exists()) {
              setProfile({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile);
              setLoading(false);
            } else {
              setProfile(null);
            }
          }, (error) => {
            // Ignore permission errors during logout or if user is null
            if (!auth.currentUser || error.code === 'permission-denied') {
              console.warn("Profile sync permission denied or user logged out.");
              return;
            }
            
            console.error("Profile sync error for UID:", firebaseUser.uid, error);
            try {
              handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            } catch (e) {
              setLoading(false);
            }
          });
        };

        // Small delay to ensure Firestore has the auth token correctly
        const syncTimeout = setTimeout(startSync, 150);

        // Safety timeout to prevent infinite loading if profile doc is missing
        const profileTimeout = setTimeout(() => {
          setLoading(false);
        }, 8000);
        
        return () => {
          clearTimeout(syncTimeout);
          clearTimeout(profileTimeout);
        };
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = undefined;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return { user, profile, loading };
}
