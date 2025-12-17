const dictionary = {
  hero: {
    headline: 'Sabores Artesanales, Directo de Casa',
    subheadline:
      'Descubre platillos únicos, hechos a mano con pasión por chefs locales.',
    cta: 'Explora Ahora',
  },
  chefShowcase: {
    headline: 'Conoce a Nuestros Chefs',
    tagline: 'El corazón y el alma detrás de nuestras delicias caseras.',
    specialty: 'Especialista en repostería y delicias horneadas con amor.',
    viewProfile: 'Ver Perfil',
    productCount: (count: number) => `${count} productos`,
  },
  promotionsBanner: {
    title: 'Ofertas Especiales',
  },
  productShowcase: {
    sweets: 'Dulces',
    savory: 'Salados',
    noProductsMatch: 'No hay productos que coincidan con tus filtros.',
    tryAdjusting: '¡Intenta ajustar tu selección para encontrar más delicias!',
    filters: {
      glutenFree: 'Sin Gluten',
      vegan: 'Vegano',
      dairyFree: 'Sin Lactosa',
      nutFree: 'Sin Nueces',
    }
  },
  productCard: {
    addToCart: 'Añadir',
    addedToCart: '¡Añadido al carrito!',
    inYourCart: (productName: string) => `${productName} está ahora en tu carrito.`,
    by: 'Por',
  },
  cartView: {
    empty: {
      title: 'Tu carrito está vacío',
      description: 'Parece que aún no has añadido nada a tu carrito.',
      cta: 'Comienza a Comprar'
    },
    orderSummary: 'Resumen del Pedido',
    subtotal: 'Subtotal',
    platformFee: 'Tarifa de Plataforma (10%)',
    deliveryFee: 'Costo de Envío',
    total: 'Total',
    estimatedDelivery: 'Entrega Estimada:',
    preparationTime: (hours: number) => `Basado en ${hours}h de preparación.`,
    proceedToCheckout: 'Proceder al Pago',
    checkoutModal: {
      title: '¡Atención!',
      description: (hours: number, date: string) => `Tu pedido requiere hasta ${hours} horas de preparación. El tiempo de entrega estimado es ${date}. ¡Por favor, planifica en consecuencia!`,
      cancel: 'Cancelar',
      continue: 'Continuar',
    }
  },
  siteHeader: {
    home: 'Inicio',
    sweets: 'Dulces',
    savory: 'Salados',
    chefs: 'Chefs',
    chefDashboard: 'Panel de Chef',
    changeLanguage: 'Cambiar idioma',
    shoppingCart: 'Carrito de Compras',
    profile: 'Perfil',
    admin: 'Admin',
    logout: 'Cerrar sesión',
    signup: 'Crear cuenta',
    login: 'Iniciar sesión',
  },
  chefSidebar: {
    title: 'Portal del Chef',
    dashboard: 'Dashboard',
    orders: 'Pedidos',
    products: 'Productos',
    promotions: 'Promociones',
    backToStore: 'Volver a la Tienda',
  }
};

export default dictionary;
