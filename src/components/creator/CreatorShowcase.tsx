'use client';

import { Creator } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';

interface CreatorShowcaseProps {
    creators: (Creator & { products?: any[] })[];
    isPage?: boolean;
}

export function CreatorShowcase({ creators, isPage = false }: CreatorShowcaseProps) {
    const dict = useDictionary();

    return (
        <section>
            {isPage || (
                 <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold mb-4">{dict.creatorShowcase.headline}</h2>
                    <p className="text-lg text-muted-foreground">
                        {dict.creatorShowcase.tagline}
                    </p>
                </div>
            )}
            {isPage ? (
                 <div className="text-center mb-12">
                    <h1 className="font-headline text-5xl font-bold mb-4">{dict.creatorShowcase.headline}</h1>
                    <p className="text-xl text-muted-foreground">
                        {dict.creatorShowcase.tagline}
                    </p>
                </div>
            ) : null}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isPage ? 'lg:grid-cols-3' : ''} gap-8`}>
                {creators.map(creator => (
                    <Card key={creator.id} className="text-center flex flex-col">
                        <CardHeader className="items-center">
                            <Image 
                                src={creator.profilePictureUrl} 
                                alt={creator.name} 
                                width={120} 
                                height={120} 
                                className={cn(
                                    "rounded-full aspect-square object-cover border-4",
                                    creator.gender === 'female' ? 'border-primary' : 'border-blue-400'
                                )} 
                                data-ai-hint={creator.imageHint} 
                            />
                            <CardTitle className="font-headline text-2xl pt-4">{creator.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <CardDescription>{dict.creatorShowcase.specialty}</CardDescription>
                            {isPage && creator.products && (
                                 <p className="text-sm text-muted-foreground mt-2">{dict.creatorShowcase.productCount(creator.products.length)}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
