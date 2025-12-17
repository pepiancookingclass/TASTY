'use client';

import { products, sampleChef } from '@/lib/data';
import { Chef } from '@/lib/types';
import { ChefShowcase } from '@/components/chef/ChefShowcase';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

export default function ChefsPage() {
    // In a real app, you'd fetch all chefs
    const chefs: Chef[] = [
        sampleChef,
        { id: 'chef-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548', imageHint: 'chef portrait', gender: 'male' },
    ];

    const chefsWithProducts = chefs.map(chef => {
        return {
            ...chef,
            products: products.filter(p => p.chefId === chef.id)
        }
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <Breadcrumb className="mb-8">
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Chefs</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <ChefShowcase chefs={chefsWithProducts} isPage={true} />

            <Card className="mt-16 text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">¿Eventos o Pedidos Especiales?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        ¿Planeando una celebración o necesitas algo hecho a tu medida? Contáctanos para discutir tus ideas.
                    </p>
                    <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                        <Link href="https://wa.me/50212345678" target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="mr-2 h-6 w-6" />
                            Contactar por WhatsApp
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
