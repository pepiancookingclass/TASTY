import { Product, Promotion, Creator } from './types';

// Creadores - IDs que coinciden con la base de datos
export const sampleCreator: Creator = {
  id: 'c0000001-0000-0000-0000-000000000001',
  name: 'Valentina Dávila',
  email: 'valentina@tasty.com',
  profilePictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  imageHint: 'woman portrait pastry chef',
  gender: 'female',
  skills: ['pastry'],
};

export const creatorMariaHerman: Creator = {
  id: 'c0000002-0000-0000-0000-000000000002',
  name: 'Maria Herman',
  email: 'maria.herman@tasty.com',
  profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
  imageHint: 'woman artisan portrait',
  gender: 'female',
  skills: ['pastry', 'handmade'],
};

export const creatorYiwong: Creator = {
  id: 'c0000003-0000-0000-0000-000000000003',
  name: 'Yiwong',
  email: 'yiwong@tasty.com',
  profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  imageHint: 'man chef portrait',
  gender: 'male',
  skills: ['savory'],
};

// Lista de todos los creadores
export const creators: Creator[] = [sampleCreator, creatorMariaHerman, creatorYiwong];

// Productos
export const products: Product[] = [
  // === VALENTINA DÁVILA - Pastry & Desserts ===
  {
    id: 'prod-1',
    name: { en: 'Chocolate Cake', es: 'Pastel de Chocolate' },
    type: 'dessert',
    price: 25.00,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    imageHint: 'chocolate cake',
    description: {
      en: 'Rich and moist chocolate cake with dark chocolate ganache',
      es: 'Pastel de chocolate húmedo y rico con ganache de chocolate oscuro'
    },
    ingredients: {
      en: 'Flour, cocoa, eggs, butter, sugar, dark chocolate',
      es: 'Harina, cacao, huevos, mantequilla, azúcar, chocolate oscuro'
    },
    creatorId: 'c0000001-0000-0000-0000-000000000001',
    preparationTime: 4,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-2',
    name: { en: 'Vanilla Cupcakes', es: 'Cupcakes de Vainilla' },
    type: 'pastry',
    price: 3.50,
    imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400',
    imageHint: 'vanilla cupcakes with frosting',
    description: {
      en: 'Light vanilla cupcakes with buttercream frosting',
      es: 'Cupcakes ligeros de vainilla con frosting de buttercream'
    },
    ingredients: {
      en: 'Flour, eggs, butter, sugar, vanilla extract, cream',
      es: 'Harina, huevos, mantequilla, azúcar, extracto de vainilla, crema'
    },
    creatorId: 'c0000001-0000-0000-0000-000000000001',
    preparationTime: 2,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-3',
    name: { en: 'Chocolate Chip Cookies', es: 'Galletas con Chispas de Chocolate' },
    type: 'cookie',
    price: 2.00,
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400',
    imageHint: 'chocolate chip cookies',
    description: {
      en: 'Crispy outside, chewy inside chocolate chip cookies',
      es: 'Galletas crujientes por fuera, suaves por dentro con chispas de chocolate'
    },
    ingredients: {
      en: 'Flour, butter, sugar, eggs, chocolate chips',
      es: 'Harina, mantequilla, azúcar, huevos, chispas de chocolate'
    },
    creatorId: 'c0000001-0000-0000-0000-000000000001',
    preparationTime: 1,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-4',
    name: { en: 'Tres Leches Cake', es: 'Pastel Tres Leches' },
    type: 'dessert',
    price: 30.00,
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400',
    imageHint: 'tres leches cake slice',
    description: {
      en: 'Traditional tres leches cake soaked in three types of milk',
      es: 'Pastel tradicional tres leches bañado en tres tipos de leche'
    },
    ingredients: {
      en: 'Flour, eggs, condensed milk, evaporated milk, cream, vanilla',
      es: 'Harina, huevos, leche condensada, leche evaporada, crema, vainilla'
    },
    creatorId: 'c0000001-0000-0000-0000-000000000001',
    preparationTime: 6,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },

  // === MARIA HERMAN - Handmade Crafts & Pastry ===
  {
    id: 'prod-5',
    name: { en: 'Handmade Wool Blanket', es: 'Colcha de Lana Hecha a Mano' },
    type: 'handmade',
    price: 150.00,
    imageUrl: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=400',
    imageHint: 'knitted wool blanket cozy',
    description: {
      en: 'Beautiful handwoven wool blanket, perfect for cozy nights',
      es: 'Hermosa colcha de lana tejida a mano, perfecta para noches acogedoras'
    },
    ingredients: {
      en: '100% natural wool, handwoven with traditional techniques',
      es: '100% lana natural, tejida a mano con técnicas tradicionales'
    },
    creatorId: 'c0000002-0000-0000-0000-000000000002',
    preparationTime: 72,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: false,
      isDairyFree: true,
      isNutFree: true,
    },
  },
  {
    id: 'prod-6',
    name: { en: 'Christmas Ornaments Set', es: 'Set de Adornos Navideños' },
    type: 'handmade',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=400',
    imageHint: 'handmade christmas ornaments decorations',
    description: {
      en: 'Set of 6 handcrafted Christmas ornaments, each unique',
      es: 'Set de 6 adornos navideños hechos a mano, cada uno único'
    },
    ingredients: {
      en: 'Fabric, beads, thread, natural materials',
      es: 'Tela, cuentas, hilo, materiales naturales'
    },
    creatorId: 'c0000002-0000-0000-0000-000000000002',
    preparationTime: 24,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: true,
      isDairyFree: true,
      isNutFree: true,
    },
  },
  {
    id: 'prod-7',
    name: { en: 'Artisan Crochet Basket', es: 'Canasta de Crochet Artesanal' },
    type: 'handmade',
    price: 35.00,
    imageUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400',
    imageHint: 'handmade woven basket',
    description: {
      en: 'Handmade crochet storage basket, perfect for home decor',
      es: 'Canasta de almacenamiento de crochet hecha a mano, perfecta para decoración del hogar'
    },
    ingredients: {
      en: 'Cotton rope, natural dyes',
      es: 'Cuerda de algodón, tintes naturales'
    },
    creatorId: 'c0000002-0000-0000-0000-000000000002',
    preparationTime: 12,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: true,
      isDairyFree: true,
      isNutFree: true,
    },
  },
  {
    id: 'prod-8',
    name: { en: 'French Macarons Box', es: 'Caja de Macarons Franceses' },
    type: 'pastry',
    price: 28.00,
    imageUrl: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400',
    imageHint: 'french macarons colorful',
    description: {
      en: 'Box of 12 assorted French macarons in various flavors',
      es: 'Caja de 12 macarons franceses surtidos en varios sabores'
    },
    ingredients: {
      en: 'Almond flour, egg whites, sugar, butter, natural flavors',
      es: 'Harina de almendra, claras de huevo, azúcar, mantequilla, sabores naturales'
    },
    creatorId: 'c0000002-0000-0000-0000-000000000002',
    preparationTime: 6,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: false,
      isDairyFree: false,
      isNutFree: false,
    },
  },

  // === YIWONG - Savory Dishes ===
  {
    id: 'prod-9',
    name: { en: 'Truffle Mushroom Pasta', es: 'Pasta con Trufa y Hongos' },
    type: 'savory',
    price: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400',
    imageHint: 'truffle mushroom pasta gourmet',
    description: {
      en: 'Fresh homemade pasta with truffle oil and wild mushrooms',
      es: 'Pasta fresca hecha en casa con aceite de trufa y hongos silvestres'
    },
    ingredients: {
      en: 'Fresh pasta, truffle oil, wild mushrooms, parmesan, cream, garlic',
      es: 'Pasta fresca, aceite de trufa, hongos silvestres, parmesano, crema, ajo'
    },
    creatorId: 'c0000003-0000-0000-0000-000000000003',
    preparationTime: 2,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-10',
    name: { en: 'Artisan Wood-Fired Pizza', es: 'Pizza Artesanal al Horno de Leña' },
    type: 'savory',
    price: 18.00,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    imageHint: 'wood fired pizza artisan',
    description: {
      en: 'Traditional Neapolitan pizza baked in wood-fired oven',
      es: 'Pizza napolitana tradicional horneada en horno de leña'
    },
    ingredients: {
      en: 'Italian flour, San Marzano tomatoes, fresh mozzarella, basil, olive oil',
      es: 'Harina italiana, tomates San Marzano, mozzarella fresca, albahaca, aceite de oliva'
    },
    creatorId: 'c0000003-0000-0000-0000-000000000003',
    preparationTime: 3,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-11',
    name: { en: 'Beef Wellington', es: 'Beef Wellington' },
    type: 'savory',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
    imageHint: 'beef wellington gourmet',
    description: {
      en: 'Classic Beef Wellington with mushroom duxelles and puff pastry',
      es: 'Clásico Beef Wellington con duxelles de hongos y hojaldre'
    },
    ingredients: {
      en: 'Beef tenderloin, puff pastry, mushrooms, prosciutto, dijon mustard',
      es: 'Lomo de res, hojaldre, hongos, prosciutto, mostaza Dijon'
    },
    creatorId: 'c0000003-0000-0000-0000-000000000003',
    preparationTime: 5,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
];

// Promociones
export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    title: { en: 'Weekend Special', es: 'Especial de Fin de Semana' },
    description: {
      en: 'Get 20% off on all desserts this weekend!',
      es: '¡Obtén 20% de descuento en todos los postres este fin de semana!'
    },
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
    imageHint: 'desserts promotion',
    discountPercentage: 20,
  },
  {
    id: 'promo-2',
    title: { en: 'Free Cookie Friday', es: 'Viernes de Galleta Gratis' },
    description: {
      en: 'Get a free cookie with any purchase over $15',
      es: 'Obtén una galleta gratis con cualquier compra mayor a $15'
    },
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
    imageHint: 'cookies promotion',
    freeItem: 'prod-3',
  },
];

// Helper para obtener productos por tipo
export const getProductsByType = (type: Product['type']) => 
  products.filter(p => p.type === type);

// Helper para obtener productos dulces (pastry, dessert, cookie)
export const getSweetProducts = () => 
  products.filter(p => ['pastry', 'dessert', 'cookie'].includes(p.type));

// Helper para obtener productos salados
export const getSavoryProducts = () => 
  products.filter(p => p.type === 'savory');

// Helper para obtener productos handmade
export const getHandmadeProducts = () => 
  products.filter(p => p.type === 'handmade');

// Helper para obtener productos por creador
export const getProductsByCreator = (creatorId: string) =>
  products.filter(p => p.creatorId === creatorId);

// Helper para obtener un creador por ID
export const getCreatorById = (id: string) =>
  creators.find(c => c.id === id);
