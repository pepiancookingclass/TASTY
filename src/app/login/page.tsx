'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/user/profile');
    }
  }, [user, loading, router]);


  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/user/profile');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  if (loading || user) {
    return <div className="container flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="container flex justify-center items-center h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Welcome</CardTitle>
          <CardDescription>Sign in to continue to Tasty</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={handleGoogleSignIn} variant="outline">
            <GoogleIcon className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
