'use client';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UserProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
    }
  }, [user, loading, router]);


  if (loading || !user) {
    return <div className="container flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-8">My Profile</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
              <AvatarFallback>{(user.displayName || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="font-headline text-2xl">{user.displayName}</CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form>
            <div className="space-y-6">
              <div>
                <h3 className="font-headline text-lg mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="555-123-4567" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-headline text-lg mb-4">Delivery Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input id="street" placeholder="123 Main St" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Foodville"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="CA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="90210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="USA" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                  <Button>Save Changes</Button>
              </div>

            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
