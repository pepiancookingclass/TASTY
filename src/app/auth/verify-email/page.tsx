'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AnimatedSwan } from '@/components/AnimatedSwan';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (type === 'signup' && token) {
      toast({
        title: "¡Correo verificado!",
        description: "Tu cuenta ha sido verificada exitosamente. Redirigiendo...",
      });
      setTimeout(() => router.push('/login'), 3000);
    } else {
      router.push('/');
    }
  }, [searchParams, router, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <AnimatedSwan size={72} />
      <p className="text-sm text-muted-foreground">Verificando tu correo electrónico...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <AnimatedSwan size={72} />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
