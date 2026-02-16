// src/app/layout.tsx
'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { HelpSticker } from "@/components/shared/HelpSticker";
import { CartProvider } from '@/context/CartProvider';
import { LanguageProvider } from '@/context/LanguageProvider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet" />
        
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MJSSW7R01F"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MJSSW7R01F');
            `,
          }}
        />
        
        {/* Microsoft Clarity */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "vicdzd41fb");
            `,
          }}
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased', inter.className)}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">
                  {children}
                </main>
              </div>
              <HelpSticker />
              <Toaster />
              <PageViewTracker />
              <Analytics />
              <SpeedInsights />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
