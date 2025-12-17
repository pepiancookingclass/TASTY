'use client';
import { promotions } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PromotionForm } from '@/components/admin/PromotionForm';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDictionary } from '@/hooks/useDictionary';

export default function AdminPromotionsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { language } = useLanguage();
  const dict = useDictionary();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  //   // In a real app, you would also check if the user has an 'admin' role
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div className="container flex justify-center items-center h-screen"><p>{dict.loading}</p></div>;
  // }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-8">{dict.adminPromotions.title}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">{dict.adminPromotions.createTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <PromotionForm />
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">{dict.adminPromotions.currentTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {promotions.map(promo => (
                        <div key={promo.id} className="flex items-center gap-4 rounded-lg border p-4">
                            <Image src={promo.imageUrl} alt={promo.title[language]} width={80} height={80} className="rounded-md aspect-square object-cover" data-ai-hint={promo.imageHint} />
                            <div className="flex-grow">
                                <h3 className="font-bold">{promo.title[language]}</h3>
                                <p className="text-sm text-muted-foreground">{promo.description[language]}</p>
                            </div>
                            {promo.discountPercentage && (
                                <Badge variant="default">{promo.discountPercentage}% OFF</Badge>
                            )}
                            {promo.freeItem && (
                                 <Badge variant="secondary">{dict.adminPromotions.freeItemBadge}</Badge>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
