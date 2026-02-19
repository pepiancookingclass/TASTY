'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useDictionary } from '@/hooks/useDictionary';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const dict = useDictionary();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-reset-password-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.error || 'Error al procesar la solicitud');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container flex justify-center items-center h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="font-headline text-2xl">¡Revisa tu correo!</CardTitle>
            <CardDescription>
              Si existe una cuenta con el email <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              El enlace expirará en 1 hora. Revisa también tu carpeta de spam.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex justify-center items-center h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="font-headline text-2xl">¿Olvidaste tu contraseña?</CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecerla.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </Button>
          </form>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
