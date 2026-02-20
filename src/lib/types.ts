
export type DeliveryVehicle = 'moto' | 'auto';

export type Product = {
  id: string;
  name: {
    en: string;
    es: string;
  };
  type: 'pastry' | 'dessert' | 'savory' | 'cookie' | 'handmade' | 'seasonal' | 'other';
  price: number;
  imageUrl: string;
  imageUrls: string[]; // Array de imágenes para galería/carrusel
  imageHint: string;
  description: {
    en: string;
    es: string;
  };
  ingredients: {
    en: string;
    es: string;
  };
  creatorId: string;
  preparationTime: number; // in hours
  dietaryFlags: {
    isGlutenFree: boolean;
    isVegan: boolean;
    isDairyFree: boolean;
    isNutFree: boolean;
  };
  deliveryVehicle?: DeliveryVehicle; // 'moto' (default) or 'auto'
  isSoldOut?: boolean; // Producto agotado/vendido
};

export type Promotion = {
  id: string;
  title: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  imageUrl: string;
  imageHint: string;
  discountPercentage?: number;
  freeItem?: string; // product id
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePictureUrl: string;
  imageHint: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

export type AvailabilityStatus = 'available' | 'vacation' | 'busy';

export type Creator = {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string;
  imageHint: string;
  gender: 'male' | 'female';
  skills?: ('pastry' | 'savory' | 'handmade')[];
  hasDelivery?: boolean;
  availabilityStatus?: AvailabilityStatus;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderStatusKey = 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type Order = {
    id: string;
    customerName: string;
    orderDate: Date;
    deliveryDate: Date;
    items: CartItem[];
    status: OrderStatusKey;
    total: number;
}

// Tipos para el sistema de combos
export interface Combo {
  id: string;
  name_es: string;
  name_en?: string;
  description_es: string;
  description_en?: string;
  image_url?: string;
  category: 'sweet_savory' | 'breakfast' | 'dessert_mix' | 'full_meal' | 'artisan_mix';
  total_price: number;
  original_price: number;
  discount_percentage: number;
  is_active: boolean;
  is_featured: boolean;
  available_from: string;
  available_until?: string;
  max_orders?: number;
  current_orders: number;
  preparation_time: number;
  created_at: string;
  created_by: string;
  creators_count?: number;
  products_count?: number;
}

export interface ComboItem {
  id: string;
  combo_id: string;
  product_id: string;
  creator_id: string;
  quantity: number;
  individual_price: number;
  creator_percentage: number;
  product?: Product;
  creator?: User;
}

export interface ComboCreator {
  id: string;
  combo_id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  products_count: number;
  total_contribution: number;
  revenue_percentage: number;
}

export interface ComboDetails extends Combo {
  items: ComboItem[];
  creators: ComboCreator[];
}