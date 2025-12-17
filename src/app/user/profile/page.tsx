'use client';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDictionary } from '@/hooks/useDictionary';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Checkbox } from '@/components/ui/checkbox';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Skill = 'pastry' | 'savory' | 'handmade';

export default function UserProfilePage() {
  const { user, loading } = useUser();
  const firestore = useFirestore();
  const { roles } = useUserRoles();
  const router = useRouter();
  const dict = useDictionary();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);

  const isCreator = roles.includes('creator');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user && firestore) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        const userRef = doc(firestore, 'users', user.uid);
        const getUserData = async () => {
            const docSnap = await doc(userRef).get();
            if (docSnap.exists()) {
                setSkills(docSnap.data().skills || []);
            }
        };
        getUserData();
    }
  }, [user, loading, router, firestore]);

  const handleSkillChange = (skill: Skill, checked: boolean) => {
    setSkills(prev => 
      checked ? [...prev, skill] : prev.filter(s => s !== skill)
    );
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    const userRef = doc(firestore, 'users', user.uid);
    try {
        await setDoc(userRef, { 
            name: displayName, 
            email: email,
            ...(isCreator && { skills }) 
        }, { merge: true });
        toast({
            title: dict.userProfile.saveSuccessTitle,
            description: dict.userProfile.saveSuccessDescription,
        });
    } catch (error) {
        console.error("Error updating profile: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save changes.",
        });
    }
  };

  if (loading || !user) {
    return <div className="container flex justify-center items-center h-screen"><p>{dict.loading}</p></div>;
  }

  const skillOptions: {id: Skill, label: keyof typeof dict.creatorSkills}[] = [
    { id: 'pastry', label: 'pastry' },
    { id: 'savory', label: 'savory' },
    { id: 'handmade', label: 'handmade' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-8">{dict.userProfile.title}</h1>
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
          <form onSubmit={handleSaveChanges}>
            <div className="space-y-6">
              <div>
                <h3 className="font-headline text-lg mb-4">{dict.userProfile.personalInfo.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{dict.userProfile.personalInfo.name}</Label>
                    <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{dict.userProfile.personalInfo.email}</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{dict.userProfile.personalInfo.phone}</Label>
                    <Input id="phone" type="tel" placeholder="555-123-4567" />
                  </div>
                </div>
              </div>

              {isCreator && (
                <>
                    <Separator />
                    <div>
                        <h3 className="font-headline text-lg mb-4">{dict.userProfile.skills.title}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {skillOptions.map(skill => (
                                <div key={skill.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={skill.id} 
                                        checked={skills.includes(skill.id)}
                                        onCheckedChange={(checked) => handleSkillChange(skill.id, !!checked)}
                                    />
                                    <Label htmlFor={skill.id} className="font-normal">{dict.creatorSkills[skill.label]}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="font-headline text-lg mb-4">{dict.userProfile.address.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">{dict.userProfile.address.street}</Label>
                    <Input id="street" placeholder="123 Main St" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{dict.userProfile.address.city}</Label>
                    <Input id="city" placeholder="Foodville"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">{dict.userProfile.address.state}</Label>
                    <Input id="state" placeholder="CA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">{dict.userProfile.address.zip}</Label>
                    <Input id="zip" placeholder="90210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{dict.userProfile.address.country}</Label>
                    <Input id="country" placeholder="USA" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                  <Button type="submit">{dict.userProfile.save}</Button>
              </div>

            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
