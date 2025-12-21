'use client';

import { useState, useEffect } from 'react';
import { Promotion } from '@/lib/types';
import { getActivePromotions, getAllPromotions } from '@/lib/services/promotions';
import { promotions as staticPromotions } from '@/lib/data';

export function usePromotions(activeOnly: boolean = true) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        setLoading(true);
        const data = activeOnly 
          ? await getActivePromotions() 
          : await getAllPromotions();
        // Si no hay datos en la DB, usar datos estáticos
        setPromotions(data.length > 0 ? data : staticPromotions);
      } catch (err) {
        console.error('Error loading promotions:', err);
        setError('Error loading promotions');
        // Fallback a datos estáticos
        setPromotions(staticPromotions);
      } finally {
        setLoading(false);
      }
    }

    fetchPromotions();
  }, [activeOnly]);

  return { promotions, loading, error };
}

