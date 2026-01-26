'use client';

import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useMemo } from 'react';

// Hook de compatibilidad que usa el AuthProvider de Supabase
export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<{
    name?: string;
    profile_picture_url?: string;
    phone?: string;
    address_street?: string;
    address_city?: string;
    address_state?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileData(null);
        return;
      }

      // Solo fetch si no tenemos datos o si el user ID cambió
      if (profileData && user.id) {
        return; // Ya tenemos datos para este usuario
      }

      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, profile_picture_url, phone, address_street, address_city, address_state')
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
  }, [user?.id]); // Solo depender del ID, no del objeto completo

  const memoizedUser = useMemo(() => {
    if (!user) return null;

    return {
      uid: user.id,
      email: user.email,
      displayName: profileData?.name || user.user_metadata?.name || user.email?.split('@')[0] || null,
      photoURL: profileData?.profile_picture_url || user.user_metadata?.avatar_url || null,
      phone: profileData?.phone,
      address_street: profileData?.address_street,
      address_city: profileData?.address_city,
      address_state: profileData?.address_state,
    };
  }, [
    user?.id,
    user?.email,
    user?.user_metadata?.name,
    user?.user_metadata?.avatar_url,
    profileData?.name,
    profileData?.profile_picture_url,
    profileData?.phone,
    profileData?.address_street,
    profileData?.address_city,
    profileData?.address_state,
  ]);

  return {
    user: memoizedUser,
    loading: authLoading || profileLoading,
  };
}

