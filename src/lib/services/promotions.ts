import { supabase } from '@/lib/supabase';
import { Promotion } from '@/lib/types';

// Transformar datos de Supabase a Promotion
function transformPromotion(data: any): Promotion {
  return {
    id: data.id,
    title: {
      en: data.title_en,
      es: data.title_es,
    },
    description: {
      en: data.description_en || '',
      es: data.description_es || '',
    },
    imageUrl: data.image_url || '',
    imageHint: data.image_hint || '',
    discountPercentage: data.discount_percentage,
    freeItem: data.free_item_id,
  };
}

// Obtener promociones activas
export async function getActivePromotions(): Promise<Promotion[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }

  return data.map(transformPromotion);
}

// Obtener todas las promociones
export async function getAllPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all promotions:', error);
    return [];
  }

  return data.map(transformPromotion);
}

// Crear una promoción
export async function createPromotion(promotion: Omit<Promotion, 'id'> & { 
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}): Promise<Promotion | null> {
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      title_en: promotion.title.en,
      title_es: promotion.title.es,
      description_en: promotion.description.en,
      description_es: promotion.description.es,
      image_url: promotion.imageUrl,
      image_hint: promotion.imageHint,
      discount_percentage: promotion.discountPercentage,
      free_item_id: promotion.freeItem,
      is_active: promotion.isActive ?? true,
      start_date: promotion.startDate?.toISOString(),
      end_date: promotion.endDate?.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating promotion:', error);
    return null;
  }

  return transformPromotion(data);
}

// Actualizar una promoción
export async function updatePromotion(id: string, promotion: Partial<Promotion> & {
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}): Promise<Promotion | null> {
  const updateData: any = {};

  if (promotion.title) {
    updateData.title_en = promotion.title.en;
    updateData.title_es = promotion.title.es;
  }
  if (promotion.description) {
    updateData.description_en = promotion.description.en;
    updateData.description_es = promotion.description.es;
  }
  if (promotion.imageUrl) updateData.image_url = promotion.imageUrl;
  if (promotion.imageHint) updateData.image_hint = promotion.imageHint;
  if (promotion.discountPercentage !== undefined) updateData.discount_percentage = promotion.discountPercentage;
  if (promotion.freeItem) updateData.free_item_id = promotion.freeItem;
  if (promotion.isActive !== undefined) updateData.is_active = promotion.isActive;
  if (promotion.startDate) updateData.start_date = promotion.startDate.toISOString();
  if (promotion.endDate) updateData.end_date = promotion.endDate.toISOString();

  const { data, error } = await supabase
    .from('promotions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating promotion:', error);
    return null;
  }

  return transformPromotion(data);
}

// Eliminar una promoción
export async function deletePromotion(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promotion:', error);
    return false;
  }

  return true;
}

// Desactivar una promoción
export async function deactivatePromotion(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('promotions')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating promotion:', error);
    return false;
  }

  return true;
}

