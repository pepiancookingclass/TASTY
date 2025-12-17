export type Product = {
  id: string;
  name: string;
  type: 'pastry' | 'dessert' | 'savory';
  price: number;
  imageUrl: string;
  imageHint: string;
  description: {
    en: string;
    es: string;
  };
  ingredients: string[];
  chefId: string;
  preparationTime: number; // in hours
  dietaryFlags: {
    isGlutenFree: boolean;
    isVegan: boolean;
    isDairyFree: boolean;
    isNutFree: boolean;
  };
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
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

export type Chef = {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string;
  imageHint: string;
  gender: 'male' | 'female';
};

export type CartItem = {
  product: Product;
  quantity: number;
};
