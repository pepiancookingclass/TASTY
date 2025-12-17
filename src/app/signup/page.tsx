
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
import { LocateIcon, Info } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { departments, type Municipality } from '@/lib/guatemala-locations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDictionary } from '@/hooks/useDictionary';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [street, setStreet] = useState('');
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);

  const [geolocation, setGeolocation] = useState<{latitude: number; longitude: number} | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleDepartmentChange = (departmentName: string) => {
    setSelectedDepartment(departmentName);
    setSelectedMunicipality(null);
    const department = departments.find(d => d.name === departmentName);
    setMunicipalities(department ? department.municipalities : []);
  }

  const handleMunicipalityChange = (municipalityName: string) => {
    const municipality = municipalities.find(m => m.name === municipalityName);
    setSelectedMunicipality(municipality || null);
  }

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
            title: dict.signupPage.locationToastTitle,
            description: dict.signupPage.locationToastDescription,
          });
          setIsLocating(false);
        },
        (error) => {
          toast({
            variant: "destructive",
            title: dict.signupPage.locationErrorTitle,
            description: error.message,
          });
          setIsLocating(false);
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: dict.signupPage.unsupportedError,
        description: dict.signupPage.unsupportedDescription,
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      setError("Firebase not initialized.");
      return;
    }
    if (!selectedDepartment || !selectedMunicipality) {
        setError("Please select your department and city.");
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
          ciudad: selectedMunicipality.name,
          departamento: selectedDepartment,
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
          <CardTitle className="font-headline text-3xl">{dict.signupPage.title}</CardTitle>
          <CardDescription>{dict.signupPage.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{dict.signupPage.nameLabel}</Label>
                    <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">{dict.signupPage.emailLabel}</Label>
                    <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">{dict.signupPage.passwordLabel}</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            
            <Separator />

            <h3 className="font-headline text-lg">{dict.signupPage.deliveryAddress}</h3>

            <div className="space-y-2">
                <Label htmlFor="street">{dict.signupPage.streetLabel}</Label>
                <Input id="street" required value={street} onChange={e => setStreet(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="department">{dict.signupPage.departmentLabel}</Label>
                    <Select onValueChange={handleDepartmentChange} required>
                        <SelectTrigger id="department">
                            <SelectValue placeholder={dict.signupPage.departmentPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map(dep => (
                                <SelectItem key={dep.name} value={dep.name}>{dep.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="city">{dict.signupPage.cityLabel}</Label>
                    <Select onValueChange={handleMunicipalityChange} required disabled={!selectedDepartment}>
                        <SelectTrigger id="city">
                            <SelectValue placeholder={dict.signupPage.cityPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {municipalities.map(mun => (
                                <SelectItem key={mun.name} value={mun.name}>{mun.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedMunicipality && !selectedMunicipality.hasDelivery && (
                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                    <Info className="h-4 w-4 !text-yellow-700" />
                    <AlertTitle className="text-yellow-800 font-semibold">{dict.signupPage.limitedCoverage.title}</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        {dict.signupPage.limitedCoverage.description}
                    </AlertDescription>
                </Alert>
            )}

            <Button type="button" variant="outline" className="w-full" onClick={handleGeolocation} disabled={isLocating}>
                <LocateIcon className={`mr-2 h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
                {geolocation ? dict.signupPage.locationSaved : dict.signupPage.useLocation}
            </Button>
            
            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full">{dict.signupPage.submit}</Button>
          </form>

          <Separator className="my-6" />

           <p className="text-center text-sm text-muted-foreground">
            {dict.signupPage.hasAccount}{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/login">{dict.signupPage.loginLink}</Link>
            </Button>
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
