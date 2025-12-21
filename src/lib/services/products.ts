import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';

// Transformar datos de Supabase a tipo Product
function transformProduct(data: any): Product {
  return {
    id: data.id,
    name: {
      en: data.name_en,
      es: data.name_es,
    },
    type: data.type,
    price: parseFloat(data.price),
    imageUrl: data.image_url || '',
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
  const { data, error } = await supabase
    .from('products')
    .insert({
      name_en: product.name.en,
      name_es: product.name.es,
      type: product.type,
      price: product.price,
      image_url: product.imageUrl,
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
  if (product.imageUrl) updateData.image_url = product.imageUrl;
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

