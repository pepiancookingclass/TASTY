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
    console.log('🚀 INICIANDO REGISTRO DE USUARIO:', { email, name });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    
    if (error) {
      console.error('❌ ERROR EN REGISTRO:', error);
      throw error;
    }
    
    console.log('✅ REGISTRO EXITOSO EN SUPABASE AUTH:', {
      userId: data.user?.id,
      email: data.user?.email,
      confirmed: data.user?.email_confirmed_at ? 'SÍ' : 'NO'
    });
    
    // ✅ ENVIAR EMAIL DE BIENVENIDA después del registro exitoso
    if (data.user) {
      console.log('🎉 Usuario creado, enviando email de bienvenida...');
      console.log('📧 DATOS PARA EMAIL:', {
        user_id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || name
      });
      
      try {
        console.log('🔄 LLAMANDO EDGE FUNCTION send-welcome-email...');
        const response = await fetch('https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4'
          },
          body: JSON.stringify({ user_id: data.user.id })
        });
        
        console.log('📡 RESPUESTA EDGE FUNCTION:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ EMAIL DE BIENVENIDA ENVIADO EXITOSAMENTE:', result);
        } else {
          const errorText = await response.text();
          console.error('❌ ERROR ENVIANDO EMAIL DE BIENVENIDA:', {
            status: response.status,
            error: errorText
          });
        }
      } catch (error) {
        console.error('❌ ERROR FETCH EMAIL DE BIENVENIDA:', error);
      }
    } else {
      console.warn('⚠️ NO SE CREÓ USUARIO, NO SE ENVÍA EMAIL');
    }
    
    console.log('🏁 REGISTRO COMPLETADO');
    return data;
  };

  const clearClientAuthData = (reason: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tasty-cart');
        sessionStorage.removeItem('tasty-cart-backup');
        sessionStorage.removeItem('tasty-cart-cleared');
        console.log('🧹 auth-provider: storages de carrito limpiados ->', reason);
      }
    } catch (err) {
      console.error('⚠️ auth signOut: error limpiando storages', err);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔒 auth-provider: iniciando signOut');
      await supabase.auth.signOut();
      console.log('✅ auth-provider: signOut exitoso');
    } catch (error) {
      console.error('❌ auth-provider: error al cerrar sesión', error);
    } finally {
      clearClientAuthData('signOut');
      setSession(null);
      setUser(null);
    }
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