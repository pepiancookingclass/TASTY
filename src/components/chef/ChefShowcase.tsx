'use client';

import { Chef } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ChefShowcaseProps {
    chefs: Chef[];
}

export function ChefShowcase({ chefs }: ChefShowcaseProps) {
    return (
        <section>
            <div className="text-center mb-12">
                <h1 className="font-headline text-5xl font-bold mb-4">Conoce a Nuestros Chefs</h1>
                <p className="text-xl text-muted-foreground">
                    El corazón y el alma detrás de nuestras delicias hechas a mano.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {chefs.map(chef => (
                    <Card key={chef.id} className="text-center">
                        <CardHeader className="items-center">
                            <Image src={chef.profilePictureUrl} alt={chef.name} width={120} height={120} className="rounded-full aspect-square object-cover border-4 border-secondary" data-ai-hint={chef.imageHint} />
                            <CardTitle className="font-headline text-2xl pt-4">{chef.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Especialista en repostería y delicias horneadas con amor.</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
