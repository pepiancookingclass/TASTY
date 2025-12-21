'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';

export function PromotionForm() {
  const { toast } = useToast();
  const dict = useDictionary();
  
  const [titleEn, setTitleEn] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionEs, setDescriptionEs] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Implementar guardado en Supabase
    toast({
      title: 'Promoción creada',
      description: 'La promoción ha sido creada exitosamente.',
    });

    // Reset form
    setTitleEn('');
    setTitleEs('');
    setDescriptionEn('');
    setDescriptionEs('');
    setDiscountPercentage('');
    setImageUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titleEn">Title (English)</Label>
        <Input
          id="titleEn"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          placeholder="Summer Sale"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="titleEs">Título (Español)</Label>
        <Input
          id="titleEs"
          value={titleEs}
          onChange={(e) => setTitleEs(e.target.value)}
          placeholder="Venta de Verano"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionEn">Description (English)</Label>
        <Textarea
          id="descriptionEn"
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder="Get amazing discounts..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionEs">Descripción (Español)</Label>
        <Textarea
          id="descriptionEs"
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
          placeholder="Obtén descuentos increíbles..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="discount">Discount Percentage</Label>
        <Input
          id="discount"
          type="number"
          min="0"
          max="100"
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
          placeholder="20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <Button type="submit" className="w-full">
        Create Promotion
      </Button>
    </form>
  );
}
