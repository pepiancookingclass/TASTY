'use client';

import { useState, useEffect } from 'react';
import { Creator } from '@/lib/types';
import { getCreators, getCreatorById } from '@/lib/services/users';
import { creators as staticCreators } from '@/lib/data';

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreators() {
      try {
        setLoading(true);
        const data = await getCreators();
        // Si no hay datos en la DB, usar datos estáticos
        setCreators(data.length > 0 ? data : staticCreators);
      } catch (err) {
        console.error('Error loading creators:', err);
        setError('Error loading creators');
        // Fallback a datos estáticos
        setCreators(staticCreators);
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, []);

  return { creators, loading, error };
}

export function useCreator(creatorId: string) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreator() {
      try {
        setLoading(true);
        const data = await getCreatorById(creatorId);
        if (data) {
          setCreator(data);
        } else {
          // Fallback a datos estáticos
          const staticCreator = staticCreators.find(c => c.id === creatorId);
          setCreator(staticCreator || null);
        }
      } catch (err) {
        console.error('Error loading creator:', err);
        const staticCreator = staticCreators.find(c => c.id === creatorId);
        setCreator(staticCreator || null);
      } finally {
        setLoading(false);
      }
    }

    if (creatorId) {
      fetchCreator();
    }
  }, [creatorId]);

  return { creator, loading };
}

