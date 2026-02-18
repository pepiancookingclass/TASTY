'use client';

import { useEffect } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';

export function ConditionalAnalytics() {
  const { roles, loading } = useUserRoles();

  useEffect(() => {
    if (loading) return;

    // Solo cargar analytics si NO es admin, creator o agent
    const isExcludedRole = roles.some(role => ['admin', 'creator', 'agent'].includes(role));
    
    if (!isExcludedRole) {
      // Cargar Google Analytics 4
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-MJSSW7R01F';
      document.head.appendChild(gtagScript);

      const gtagConfig = document.createElement('script');
      gtagConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-MJSSW7R01F');
      `;
      document.head.appendChild(gtagConfig);

      // Cargar Microsoft Clarity
      const clarityScript = document.createElement('script');
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "vicdzd41fb");
      `;
      document.head.appendChild(clarityScript);

      console.log('📊 Analytics cargados para usuario regular');
    } else {
      console.log('📊 Analytics: Skipping (admin/creator/agent)');
    }
  }, [roles, loading]);

  return null; // No renderiza nada
}