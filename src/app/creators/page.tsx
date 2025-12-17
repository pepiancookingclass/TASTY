'use client';

import { products, sampleCreator } from '@/lib/data';
import { Creator } from '@/lib/types';
import { CreatorShowcase } from '@/components/creator/CreatorShowcase';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useDictionary } from '@/hooks/useDictionary';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatorsPage() {
    const dict = useDictionary();
    // In a real app, you'd fetch all creators
    const creators: Creator[] = [
        sampleCreator,
        { id: 'creator-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548', imageHint: 'creator portrait', gender: 'male' },
    ];

    const creatorsWithProducts = creators.map(creator => {
        return {
            ...creator,
            products: products.filter(p => p.creatorId === creator.id)
        }
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <Breadcrumb className="mb-8">
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">{dict.siteHeader.home}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{dict.siteHeader.creators}</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <CreatorShowcase creators={creatorsWithProducts} isPage={true} />
            
             <Card className="mt-16 text-center shadow-lg bg-secondary">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{dict.specialEvents.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {dict.specialEvents.description}
                    </p>
                    <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                        <Link href="https://wa.me/50212345678" target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="mr-2 h-6 w-6" />
                            {dict.specialEvents.cta}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
