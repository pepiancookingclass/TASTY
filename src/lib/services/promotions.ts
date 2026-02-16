import { supabase } from '@/lib/supabase';

export interface Promotion {
  id: string;
  creator_id: string | null;
  title_es: string;
  title_en: string | null;
  description_es: string | null;
  description_en: string | null;
  image_url: string | null;
  promotion_type: 'discount' | 'free_item' | 'bundle';
  discount_percentage: number | null;
  discount_fixed: number | null;
  free_item_product_id: string | null;
  min_purchase_amount: number | null;
  min_purchase_items: number | null;
  applicable_product_ids: string[] | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  promo_code: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  creator?: { id: string; name: string };
  free_item_product?: { id: string; name_es: string };
}

export interface CreatePromotionData {
  creator_id?: string | null;
  title_es: string;
  title_en?: string;
  description_es?: string;
  description_en?: string;
  image_url?: string;
  promotion_type: 'discount' | 'free_item' | 'bundle';
  discount_percentage?: number;
  discount_fixed?: number;
  free_item_product_id?: string;
  min_purchase_amount?: number;
  min_purchase_items?: number;
  applicable_product_ids?: string[];
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  max_uses?: number;
  max_uses_per_user?: number;
  promo_code?: string;
}

// Obtener todas las promociones (para admin)
export async function getAllPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select(`
      *,
      creator:users!creator_id(id, name),
      free_item_product:products!free_item_product_id(id, name_es)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }

  return data || [];
}

// Obtener promociones de un creador
export async function getCreatorPromotions(creatorId: string): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select(`
      *,
      free_item_product:products!free_item_product_id(id, name_es)
    `)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching creator promotions:', error);
    return [];
  }

  return data || [];
}

// Obtener promociones activas públicas
export async function getActivePromotions(): Promise<Promotion[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('promotions')
    .select(`
      *,
      creator:users!creator_id(id, name),
      free_item_product:products!free_item_product_id(id, name_es)
    `)
    .eq('is_active', true)
    .or(`end_date.is.null,end_date.gt.${now}`)
    .lte('start_date', now)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active promotions:', error);
    return [];
  }

  return data || [];
}

// Crear promoción
export async function createPromotion(data: CreatePromotionData): Promise<{ success: boolean; error?: string; promotion?: Promotion }> {
  const { data: promotion, error } = await supabase
    .from('promotions')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating promotion:', error);
    return { success: false, error: error.message };
  }

  return { success: true, promotion };
}

// Actualizar promoción
export async function updatePromotion(id: string, data: Partial<CreatePromotionData>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('promotions')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error('Error updating promotion:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Eliminar promoción
export async function deletePromotion(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promotion:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Toggle activo/inactivo
export async function togglePromotionActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  return updatePromotion(id, { is_active: isActive });
}

// Validar código promocional
export async function validatePromoCode(code: string, userId?: string): Promise<{ valid: boolean; promotion?: Promotion; error?: string }> {
  const now = new Date().toISOString();
  
  const { data: promotion, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('promo_code', code.toUpperCase())
    .eq('is_active', true)
    .or(`end_date.is.null,end_date.gt.${now}`)
    .lte('start_date', now)
    .single();

  if (error || !promotion) {
    return { valid: false, error: 'Código no válido o expirado' };
  }

  // Verificar límite de usos totales
  if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) {
    return { valid: false, error: 'Esta promoción ha alcanzado su límite de usos' };
  }

  // Verificar límite de usos por usuario
  if (userId && promotion.max_uses_per_user) {
    const { count } = await supabase
      .from('promotion_uses')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', promotion.id)
      .eq('user_id', userId);

    if (count && count >= promotion.max_uses_per_user) {
      return { valid: false, error: 'Ya has usado esta promoción el máximo número de veces' };
    }
  }

  return { valid: true, promotion };
}

// Registrar uso de promoción
export async function recordPromotionUse(promotionId: string, userId: string, orderId: string, discountApplied: number): Promise<{ success: boolean }> {
  // Insertar uso
  const { error: useError } = await supabase
    .from('promotion_uses')
    .insert([{
      promotion_id: promotionId,
      user_id: userId,
      order_id: orderId,
      discount_applied: discountApplied
    }]);

  if (useError) {
    console.error('Error recording promotion use:', useError);
    return { success: false };
  }

  // Incrementar contador
  const { error: updateError } = await supabase.rpc('increment_promotion_uses', { promo_id: promotionId });
  
  if (updateError) {
    console.error('Error incrementing promotion uses:', updateError);
  }

  return { success: true };
}
