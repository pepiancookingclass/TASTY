'use client';

import { Creator } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';
import { Badge } from '../ui/badge';
import { Utensils, Brush, Sparkles, ChevronRight } from 'lucide-react';

interface CreatorShowcaseProps {
    creators: (Creator & { products?: any[] })[];
    isPage?: boolean;
}

export function CreatorShowcase({ creators, isPage = false }: CreatorShowcaseProps) {
    const dict = useDictionary();

    const skillIcons = {
        pastry: <Sparkles className="h-4 w-4" />,
        savory: <Utensils className="h-4 w-4" />,
        handmade: <Brush className="h-4 w-4" />,
    }

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
                    <Link key={creator.id} href={`/creators/${creator.id}`}>
                        <Card className="text-center flex flex-col h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                            <CardHeader className="items-center">
                                <div className="relative">
                                    {creator.profilePictureUrl && creator.profilePictureUrl.startsWith('http') ? (
                                        <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={creator.profilePictureUrl} 
                                                alt={creator.name} 
                                                className={cn(
                                                    "absolute inset-0 w-full h-full object-cover object-center border-4 group-hover:scale-105 transition-transform duration-300 rounded-full",
                                                    creator.gender === 'female' ? 'border-primary' : 'border-blue-400'
                                                )}
                                            />
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "w-[120px] h-[120px] rounded-full flex items-center justify-center text-3xl font-bold bg-muted border-4 group-hover:scale-105 transition-transform duration-300",
                                            creator.gender === 'female' ? 'border-primary' : 'border-blue-400'
                                        )}>
                                            {creator.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <CardTitle className="font-headline text-2xl pt-4 flex items-center gap-1">
                                    {creator.name}
                                    <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex justify-center flex-wrap gap-2 mb-2">
                                    {creator.skills && creator.skills.map(skill => (
                                        <Badge key={skill} variant="secondary" className="flex items-center gap-1.5">
                                            {skillIcons[skill as keyof typeof skillIcons]}
                                            <span>{dict.creatorSkills[skill as keyof typeof dict.creatorSkills]}</span>
                                        </Badge>
                                    ))}
                                </div>
                                <CardDescription>{dict.creatorShowcase.specialty}</CardDescription>
                                {isPage && creator.products && (
                                    <p className="text-sm text-muted-foreground mt-2">{dict.creatorShowcase.productCount(creator.products.length)}</p>
                                )}
                                <p className="text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Ver perfil completo →
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    )
}
