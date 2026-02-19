import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';

// Transformar datos de Supabase a tipo Product
function transformProduct(data: any): Product {
  // Obtener array de imágenes con fallback a imagen única
  const imageUrls = data.image_urls && data.image_urls.length > 0 
    ? data.image_urls 
    : data.image_url ? [data.image_url] : [];
  
  return {
    id: data.id,
    name: {
      en: data.name_en,
      es: data.name_es,
    },
    type: data.type,
    price: parseFloat(data.price),
    imageUrl: imageUrls[0] || data.image_url || '', // Primera imagen o fallback
    imageUrls: imageUrls, // Array completo de imágenes
    imageHint: data.image_hint || '',
    description: {
      en: data.description_en || '',
      es: data.description_es || '',
    },
    ingredients: {
      en: data.ingredients_en || '',
      es: data.ingredients_es || '',
    },
    creatorId: data.creator_id,
    preparationTime: data.preparation_time || 0,
    dietaryFlags: {
      isGlutenFree: data.is_gluten_free || false,
      isVegan: data.is_vegan || false,
      isDairyFree: data.is_dairy_free || false,
      isNutFree: data.is_nut_free || false,
    },
    deliveryVehicle: data.delivery_vehicle || 'moto',
    isSoldOut: data.is_sold_out || false,
  };
}

// Obtener todos los productos
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data.map(transformProduct);
}

// Obtener productos por tipo
export async function getProductsByType(type: Product['type']): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by type:', error);
    return [];
  }

  return data.map(transformProduct);
}

// Obtener productos por creador
export async function getProductsByCreator(creatorId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by creator:', error);
    return [];
  }

  return data.map(transformProduct);
}

// Obtener un producto por ID
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return transformProduct(data);
}

// Crear un producto
export async function createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  // Usar imageUrls si existe, sino crear array con imageUrl
  const imageUrls = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : product.imageUrl ? [product.imageUrl] : [];
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      name_en: product.name.en,
      name_es: product.name.es,
      type: product.type,
      price: product.price,
      image_url: imageUrls[0] || product.imageUrl, // Primera imagen como principal
      image_urls: imageUrls, // Array completo
      image_hint: product.imageHint,
      description_en: product.description.en,
      description_es: product.description.es,
      ingredients_en: product.ingredients.en,
      ingredients_es: product.ingredients.es,
      creator_id: product.creatorId,
      preparation_time: product.preparationTime,
      is_gluten_free: product.dietaryFlags.isGlutenFree,
      is_vegan: product.dietaryFlags.isVegan,
      is_dairy_free: product.dietaryFlags.isDairyFree,
      is_nut_free: product.dietaryFlags.isNutFree,
      delivery_vehicle: product.deliveryVehicle || 'moto',
      is_sold_out: product.isSoldOut || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  return transformProduct(data);
}

// Actualizar un producto
export async function updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
  const updateData: any = {};
  
  if (product.name) {
    updateData.name_en = product.name.en;
    updateData.name_es = product.name.es;
  }
  if (product.type) updateData.type = product.type;
  if (product.price !== undefined) updateData.price = product.price;
  
  // Manejar imágenes: preferir imageUrls, fallback a imageUrl
  if (product.imageUrls && product.imageUrls.length > 0) {
    updateData.image_urls = product.imageUrls;
    updateData.image_url = product.imageUrls[0]; // Primera como principal
  } else if (product.imageUrl) {
    updateData.image_url = product.imageUrl;
    updateData.image_urls = [product.imageUrl];
  }
  
  if (product.imageHint) updateData.image_hint = product.imageHint;
  if (product.description) {
    updateData.description_en = product.description.en;
    updateData.description_es = product.description.es;
  }
  if (product.ingredients) {
    updateData.ingredients_en = product.ingredients.en;
    updateData.ingredients_es = product.ingredients.es;
  }
  if (product.preparationTime !== undefined) updateData.preparation_time = product.preparationTime;
  if (product.dietaryFlags) {
    updateData.is_gluten_free = product.dietaryFlags.isGlutenFree;
    updateData.is_vegan = product.dietaryFlags.isVegan;
    updateData.is_dairy_free = product.dietaryFlags.isDairyFree;
    updateData.is_nut_free = product.dietaryFlags.isNutFree;
  }
  if (product.deliveryVehicle) updateData.delivery_vehicle = product.deliveryVehicle;
  if (product.isSoldOut !== undefined) updateData.is_sold_out = product.isSoldOut;

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }

  return transformProduct(data);
}

// Eliminar un producto
export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
}

