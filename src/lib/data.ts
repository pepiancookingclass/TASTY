
import type { Product, Promotion, User, Creator } from './types';

export const products: Product[] = [
  {
    id: 'prod-001',
    name: {
      en: 'Classic Croissant',
      es: 'Croissant Clásico',
    },
    type: 'pastry',
    price: 3.5,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
    imageHint: 'croissant pastry',
    description: {
      en: 'A buttery, flaky, viennoiserie pastry of Austrian origin, named for its historical crescent shape.',
      es: 'Un pastel de hojaldre mantecoso y escamoso de origen austriaco, llamado así por su histórica forma de media luna.',
    },
    ingredients: {
      en: 'Flour, Butter, Yeast, Sugar, Salt',
      es: 'Harina, Mantequilla, Levadura, Azúcar, Sal',
    },
    creatorId: 'creator-001',
    preparationTime: 24,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-002',
    name: {
      en: 'Chocolate Eclair',
      es: 'Éclair de Chocolate',
    },
    type: 'dessert',
    price: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62',
    imageHint: 'chocolate eclair',
    description: {
      en: 'A cream-filled oblong pastry with a rich chocolate topping.',
      es: 'Un pastelito oblongo relleno de crema con una rica cobertura de chocolate.',
    },
    ingredients: {
      en: 'Flour, Eggs, Cream, Chocolate, Sugar',
      es: 'Harina, Huevos, Crema, Chocolate, Azúcar',
    },
    creatorId: 'creator-001',
    preparationTime: 8,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-003',
    name: {
      en: 'Artisanal Sourdough',
      es: 'Pan de Masa Madre Artesanal',
    },
    type: 'savory',
    price: 8.0,
    imageUrl: 'https://images.unsplash.com/photo-1585478259715-876a6a81fc08',
    imageHint: 'sourdough bread',
    description: {
      en: 'A rustic loaf with a tangy flavor, crisp crust, and soft, chewy interior.',
      es: 'Un pan rústico con un sabor ácido, corteza crujiente e interior suave y masticable.',
    },
    ingredients: {
      en: 'Sourdough Starter, Flour, Water, Salt',
      es: 'Masa Madre, Harina, Agua, Sal',
    },
    creatorId: 'creator-002',
    preparationTime: 48,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: true,
      isDairyFree: true,
      isNutFree: true,
    },
  },
  {
    id: 'prod-004',
    name: {
      en: 'Assorted Macarons',
      es: 'Macarons Surtidos',
    },
    type: 'dessert',
    price: 12.0,
    imageUrl: 'https://images.unsplash.com/photo-1558326567-98ae2405596b',
    imageHint: 'macarons assortment',
    description: {
      en: 'A box of six colorful French macarons with various fillings.',
      es: 'Una caja de seis coloridos macarons franceses con varios rellenos.',
    },
    ingredients: {
      en: 'Almond Flour, Sugar, Egg Whites, Ganache',
      es: 'Harina de Almendras, Azúcar, Claras de Huevo, Ganache',
    },
    creatorId: 'creator-001',
    preparationTime: 12,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: false,
      isDairyFree: false,
      isNutFree: false,
    },
  },
  {
    id: 'prod-005',
    name: {
      en: 'Fudgy Vegan Brownie',
      es: 'Brownie Vegano Fudgy',
    },
    type: 'dessert',
    price: 5.0,
    imageUrl: 'https://images.unsplash.com/photo-1623428325208-0eb91d86d4b5',
    imageHint: 'vegan brownie',
    description: {
      en: 'A deliciously rich and fudgy chocolate brownie, completely plant-based.',
      es: 'Un brownie de chocolate deliciosamente rico y fudgy, completamente a base de plantas.',
    },
    ingredients: {
      en: 'Flour, Cocoa Powder, Vegan Butter, Flax Eggs, Sugar',
      es: 'Harina, Cacao en Polvo, Mantequilla Vegana, Huevos de Lino, Azúcar',
    },
    creatorId: 'creator-002',
    preparationTime: 4,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: true,
      isDairyFree: true,
      isNutFree: true,
    },
  },
  {
    id: 'prod-006',
    name: {
      en: 'Quiche Lorraine',
      es: 'Quiche Lorraine',
    },
    type: 'savory',
    price: 7.5,
    imageUrl: 'https://images.unsplash.com/photo-1701197159530-80a188e34dfc',
    imageHint: 'quiche lorraine',
    description: {
      en: 'A classic savory tart with a rich filling of bacon, eggs, and cream.',
      es: 'Una clásica tarta salada con un rico relleno de tocino, huevos y crema.',
    },
    ingredients: {
      en: 'Pastry Crust, Bacon, Eggs, Cream, Gruyere Cheese',
      es: 'Masa de hojaldre, Tocino, Huevos, Crema, Queso Gruyere',
    },
    creatorId: 'creator-001',
    preparationTime: 6,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-007',
    name: {
      en: 'Gluten-Free Cupcakes',
      es: 'Cupcakes Sin Gluten',
    },
    type: 'dessert',
    price: 4.0,
    imageUrl: 'https://images.unsplash.com/photo-1603532648955-039310d9ed75',
    imageHint: 'cupcakes',
    description: {
      en: 'Light and fluffy vanilla cupcakes made with gluten-free flour.',
      es: 'Cupcakes de vainilla ligeros y esponjosos hechos con harina sin gluten.',
    },
    ingredients: {
      en: 'Gluten-Free Flour Blend, Sugar, Eggs, Butter, Vanilla',
      es: 'Mezcla de Harina Sin Gluten, Azúcar, Huevos, Mantequilla, Vainilla',
    },
    creatorId: 'creator-002',
    preparationTime: 3,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-008',
    name: {
      en: 'Spinach Feta Turnover',
      es: 'Empanada de Espinacas y Feta',
    },
    type: 'savory',
    price: 6.0,
    imageUrl: 'https://images.unsplash.com/photo-1761243743989-726fb70af78d',
    imageHint: 'savory pastry',
    description: {
      en: 'Flaky puff pastry filled with a savory mixture of spinach and feta cheese.',
      es: 'Hojaldre escamoso relleno de una mezcla salada de espinacas y queso feta.',
    },
    ingredients: {
      en: 'Puff Pastry, Spinach, Feta Cheese, Onion, Herbs',
      es: 'Masa de hojaldre, espinacas, queso feta, cebolla, hierbas',
    },
    creatorId: 'creator-002',
    preparationTime: 4,
    dietaryFlags: {
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: true,
    },
  },
  {
    id: 'prod-009',
    name: {
      en: 'Hand-knitted Scarf',
      es: 'Bufanda Tejida a Mano',
    },
    type: 'handmade',
    price: 25.0,
    imageUrl: 'https://images.unsplash.com/photo-1621210243697-a721d3c3b0aa',
    imageHint: 'knitted scarf',
    description: {
      en: 'A warm and cozy scarf, hand-knitted with soft wool blend yarn.',
      es: 'Una bufanda cálida y acogedora, tejida a mano con suave hilo de mezcla de lana.',
    },
    ingredients: {
      en: '80% Wool, 20% Acrylic',
      es: '80% Lana, 20% Acrílico',
    },
    creatorId: 'creator-001',
    preparationTime: 72,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: true,
      isDairyFree: true,
      isNutFree: true,
    },
  },
  {
    id: 'prod-010',
    name: {
      en: 'Handmade Ceramic Mug',
      es: 'Taza de Cerámica Hecha a Mano',
    },
    type: 'handmade',
    price: 18.0,
    imageUrl: 'https://images.unsplash.com/photo-1596464243634-2452252a44c1',
    imageHint: 'ceramic mug',
    description: {
      en: 'A unique, wheel-thrown ceramic mug, perfect for your morning coffee.',
      es: 'Una taza de cerámica única, hecha en torno, perfecta para tu café de la mañana.',
    },
    ingredients: {
      en: 'Stoneware Clay, Glaze',
      es: 'Arcilla de gres, Esmalte',
    },
    creatorId: 'creator-002',
    preparationTime: 120,
    dietaryFlags: {
      isGlutenFree: true,
      isVegan: true,
      isDairyFree: true,
      isNutFree: true,
    },
  },
];

export const promotions: Promotion[] = [
  {
    id: 'promo-001',
    title: {
      en: 'Weekend Pastry Special!',
      es: '¡Especial de Repostería de Fin de Semana!',
    },
    description: {
      en: 'Get 15% off all pastries this weekend!',
      es: '¡Obtén un 15% de descuento en toda la repostería este fin de semana!',
    },
    imageUrl: 'https://images.unsplash.com/photo-1587241321921-91a834d6d191',
    imageHint: 'bakery display',
    discountPercentage: 15,
  },
  {
    id: 'promo-002',
    title: {
      en: 'Try Our New Savory Items',
      es: 'Prueba Nuestros Nuevos Platos Salados',
    },
    description: {
      en: 'Buy any savory item, get a free croissant!',
      es: '¡Compra cualquier plato salado y llévate un croissant gratis!',
    },
    imageUrl: 'https://images.unsplash.com/photo-1707322325935-4c7d6025750b',
    imageHint: 'savory food',
    freeItem: 'prod-001',
  },
];

export const sampleUser: User = {
  id: 'user-001',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  phone: '555-123-4567',
  profilePictureUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  imageHint: 'person portrait',
  address: {
    street: '123 Main St',
    city: 'Foodville',
    state: 'CA',
    zip: '90210',
    country: 'USA',
  },
};

export const sampleCreator: Creator = {
  id: 'creator-001',
  name: 'Julia Pastry',
  email: 'julia.p@tastyapp.com',
  profilePictureUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c',
  imageHint: 'creator cooking',
  gender: 'female',
};
