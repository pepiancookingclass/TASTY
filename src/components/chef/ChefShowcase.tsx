'use client';

import { Chef } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useLanguage } from '@/hooks/useLanguage';

interface ChefShowcaseProps {
    chefs: (Chef & { products?: any[] })[];
    isPage?: boolean;
}

export function ChefShowcase({ chefs, isPage = false }: ChefShowcaseProps) {
    const { language } = useLanguage();

    const content = {
        en: {
            headline: 'Meet Our Chefs',
            tagline: 'The heart and soul behind our homemade delights.',
            specialty: 'Specializing in pastries and lovingly baked treats.',
            viewProfile: 'View Profile',
            productCount: (count: number) => `${count} products`
        },
        es: {
            headline: 'Conoce a Nuestros Chefs',
            tagline: 'El corazón y el alma detrás de nuestras delicias caseras.',
            specialty: 'Especialista en repostería y delicias horneadas con amor.',
            viewProfile: 'Ver Perfil',
            productCount: (count: number) => `${count} productos`
        }
    }

    return (
        <section>
            {isPage || (
                 <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold mb-4">{content[language].headline}</h2>
                    <p className="text-lg text-muted-foreground">
                        {content[language].tagline}
                    </p>
                </div>
            )}
            {isPage ? (
                 <div className="text-center mb-12">
                    <h1 className="font-headline text-5xl font-bold mb-4">{content[language].headline}</h1>
                    <p className="text-xl text-muted-foreground">
                        {content[language].tagline}
                    </p>
                </div>
            ) : null}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isPage ? 'lg:grid-cols-3' : ''} gap-8`}>
                {chefs.map(chef => (
                    <Card key={chef.id} className="text-center flex flex-col">
                        <CardHeader className="items-center">
                            <Image src={chef.profilePictureUrl} alt={chef.name} width={120} height={120} className="rounded-full aspect-square object-cover border-4 border-secondary" data-ai-hint={chef.imageHint} />
                            <CardTitle className="font-headline text-2xl pt-4">{chef.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <CardDescription>{content[language].specialty}</CardDescription>
                            {isPage && chef.products && (
                                 <p className="text-sm text-muted-foreground mt-2">{content[language].productCount(chef.products.length)}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
