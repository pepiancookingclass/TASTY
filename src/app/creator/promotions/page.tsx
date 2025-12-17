
'use client';
import { promotions } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { DiscountPromotionForm } from '@/components/creator/promotions/DiscountPromotionForm';
import { FreeItemPromotionForm } from '@/components/creator/promotions/FreeItemPromotionForm';
import { useLanguage } from '@/hooks/useLanguage';
import { useDictionary } from '@/hooks/useDictionary';

export default function CreatorPromotionsPage() {
  // In a real app, these would be the creator's own promotions
  const creatorPromotions = promotions.slice(0,1);
  const { language } = useLanguage();
  const dict = useDictionary();

  return (
    <div>
      <h1 className="font-headline text-4xl font-bold mb-8">{dict.creatorPromotions.title}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-2xl">{dict.creatorPromotions.discount.title}</CardTitle>
                  <CardDescription>{dict.creatorPromotions.discount.description}</CardDescription>
              </CardHeader>
              <CardContent>
                  <DiscountPromotionForm />
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-2xl">{dict.creatorPromotions.freeItem.title}</CardTitle>
                  <CardDescription>{dict.creatorPromotions.freeItem.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <FreeItemPromotionForm />
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="font-headline text-2xl">{dict.creatorPromotions.current.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              {creatorPromotions.map(promo => (
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
                           <Badge variant="secondary">{dict.creatorPromotions.current.freeItemBadge}</Badge>
                      )}
                  </div>
              ))}
               {creatorPromotions.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">{dict.creatorPromotions.current.empty}</p>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
