'use client';

import { products, sampleChef } from '@/lib/data';
import { Chef } from '@/lib/types';
import { ChefShowcase } from '@/components/chef/ChefShowcase';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function ChefsPage() {
    // In a real app, you'd fetch all chefs
    const chefs: Chef[] = [
        sampleChef,
        { id: 'chef-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=1080', imageHint: 'chef portrait', gender: 'male' },
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
        </div>
    );
}
