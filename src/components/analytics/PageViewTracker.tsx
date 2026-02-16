'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useVisitorAnalytics } from '@/hooks/useVisitorAnalytics';

/**
 * Componente que auto-trackea page views en cada navegación.
 * Incluir una vez en el layout principal.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { trackPageView } = useVisitorAnalytics();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    // Evitar trackear la misma página dos veces
    if (pathname && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;
      
      // Pequeño delay para asegurar que el contexto de auth esté cargado
      const timer = setTimeout(() => {
        trackPageView(pathname);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname, trackPageView]);

  return null; // No renderiza nada
}
