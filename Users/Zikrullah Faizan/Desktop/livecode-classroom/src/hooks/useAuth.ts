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
        // Use onSnapshot to catch the document even if it's created a few ms after auth
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          console.log("Profile snapshot received. Exists:", docSnap.exists());
          if (docSnap.exists()) {
            setProfile({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile);
            setLoading(false);
          } else {
            console.warn("Profile document does not exist for user:", firebaseUser.uid);
            setProfile(null);
            // Don't set loading false yet, maybe it's still being created
          }
        }, (error) => {
          console.error("Profile sync error for UID:", firebaseUser.uid, error);
          try {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          } catch (e) {
            setLoading(false);
          }
        });

        // Safety timeout to prevent infinite loading if profile doc is missing
        const timeout = setTimeout(() => {
          setLoading(false);
        }, 5000);
        return () => clearTimeout(timeout);
      } else {
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
