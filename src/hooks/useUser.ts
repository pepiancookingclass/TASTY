'use client';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

// Hook de compatibilidad que usa el AuthProvider de Supabase
export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<{
    name?: string;
    profile_picture_url?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileData(null);
        return;
      }

      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, profile_picture_url')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return {
    user: user ? {
      uid: user.id,
      email: user.email,
      displayName: profileData?.name || user.user_metadata?.name || user.email?.split('@')[0] || null,
      photoURL: profileData?.profile_picture_url || user.user_metadata?.avatar_url || null,
    } : null,
    loading: authLoading || profileLoading,
  };
}

