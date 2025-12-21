'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export function useUserRoles() {
    const { user } = useAuth();
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setRoles([]);
            setLoading(false);
            return;
        }

        // Obtener roles iniciales
        const fetchRoles = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('roles')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                setRoles(data.roles || []);
            } else {
                setRoles([]);
            }
            setLoading(false);
        };

        fetchRoles();

        // Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel('user-roles')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.new && 'roles' in payload.new) {
                        setRoles((payload.new as { roles: string[] }).roles || []);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { roles, loading };
}
