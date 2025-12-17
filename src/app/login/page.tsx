
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { useAuth, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useDictionary } from '@/hooks/useDictionary';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading } = useUser();
  const router = useRouter();
  const dict = useDictionary();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push('/user/profile');
    }
  }, [user, loading, router]);
  
  const handleGoogleUserCreation = async (user: User) => {
    if (!firestore || !user) return;
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            roles: ['customer'],
        }, { merge: true });
    }
     router.push('/user/profile');
  }

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleGoogleUserCreation(result.user);
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing in with Google', error);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/user/profile');
    } catch (error: any) {
       setError(error.message);
    }
  };

  if (loading || user) {
    return <div className="container flex justify-center items-center h-screen"><p>{dict.loading}</p></div>;
  }

  return (
    <div className="container flex justify-center items-center h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">{dict.loginPage.title}</CardTitle>
          <CardDescription>{dict.loginPage.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={handleGoogleSignIn} variant="outline">
            <GoogleIcon className="mr-2 h-5 w-5" />
            {dict.loginPage.google}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                    {dict.loginPage.or}
                </span>
            </div>
          </div>
          
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">{dict.loginPage.emailLabel}</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">{dict.loginPage.passwordLabel}</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">{dict.loginPage.submit}</Button>
          </form>

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            {dict.loginPage.noAccount}{' '}
            <Button variant="link" asChild className="p-0 h-auto font-semibold">
              <Link href="/signup">{dict.loginPage.signupLink}</Link>
            </Button>
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
