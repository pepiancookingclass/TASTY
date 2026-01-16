// src/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // ✅ VALIDACIÓN: Evitar múltiples ejecuciones del mismo evento
        const eventKey = `${event}-${session?.user?.id || 'no-user'}-${Date.now()}`;
        if (lastEvent === eventKey) {
          console.log('⚠️ AuthProvider: Evento duplicado ignorado:', event);
          return;
        }
        setLastEvent(eventKey);
        
        if (event === 'SIGNED_IN') {
          // ✅ CORREGIDO: Solo redirigir si hay returnUrl específica
          const returnUrl = sessionStorage.getItem('returnUrl');
          if (returnUrl && returnUrl !== window.location.pathname) {
            console.log('🔄 AuthProvider: Login exitoso, redirigiendo a:', returnUrl);
            sessionStorage.removeItem('returnUrl');
            router.push(returnUrl);
          } else {
            console.log('🔄 AuthProvider: Login exitoso, manteniéndose en página actual');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 AuthProvider: Usuario deslogueado, redirigiendo a login');
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};