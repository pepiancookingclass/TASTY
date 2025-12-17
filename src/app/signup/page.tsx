
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { LocateIcon } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [geolocation, setGeolocation] = useState<{latitude: number; longitude: number} | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast({
            title: "Location Acquired!",
            description: "Your current location has been saved.",
          });
          setIsLocating(false);
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Geolocation Error",
            description: error.message,
          });
          setIsLocating(false);
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation.",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      setError("Firebase is not initialized.");
      return;
    }
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        roles: ['customer'],
        address: {
          street,
          city,
          state,
          zip,
          country,
        },
        ...(geolocation && { geolocation }),
      });
      
      router.push('/user/profile');

    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>Join Tasty to order homemade delights.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            
            <Separator />

            <h3 className="font-headline text-lg">Delivery Address</h3>

            <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" required value={street} onChange={e => setStreet(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required value={city} onChange={e => setCity(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" required value={state} onChange={e => setState(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" required value={zip} onChange={e => setZip(e.target.value)} />
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" required value={country} onChange={e => setCountry(e.target.value)} />
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGeolocation} disabled={isLocating}>
                <LocateIcon className={`mr-2 h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
                {geolocation ? "Location Saved!" : "Use Current Location"}
            </Button>
            
            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full">Create Account</Button>
          </form>

          <Separator className="my-6" />

           <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/login">Sign in</Link>
            </Button>
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
