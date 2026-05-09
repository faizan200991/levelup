import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string, retries = 5) => {
    const performFetch = async (currentUid: string, currentRetries: number) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUid)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            uid: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            photoURL: data.photo_url,
            bio: data.bio,
            learningPath: data.learning_path,
            learningPathSubtitle: data.learning_path_subtitle,
            location: data.location,
            locationSubtitle: data.location_subtitle,
            classStatus: data.class_status,
            classStatusSubtitle: data.class_status_subtitle,
            createdAt: data.created_at,
            lastActive: data.last_active
          } as UserProfile);
          setLoading(false);
        } else if (currentRetries > 0) {
          setTimeout(() => performFetch(currentUid, currentRetries - 1), 500);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (currentRetries > 0) {
          setTimeout(() => performFetch(currentUid, currentRetries - 1), 1000);
        } else {
          setLoading(false);
        }
      }
    };

    performFetch(uid, retries);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return { user, profile, loading };
}
