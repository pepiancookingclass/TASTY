'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg">Verificando tu correo electrónico...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Cargando...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
