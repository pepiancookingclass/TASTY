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
  },
  orderStatuses: {
    new: 'Nuevo',
    preparing: 'En Preparación',
    ready: 'Listo para Recoger',
    out_for_delivery: 'En Camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  },
  chefDashboard: {
    totalRevenue: {
        title: 'Ingresos Totales',
        description: 'De pedidos completados',
    },
    activeOrders: {
        title: 'Pedidos Activos',
        description: 'Nuevos o en preparación',
    },
    completedOrders: {
        title: 'Pedidos Completados',
        description: 'Pedidos entregados históricos',
    },
    commission: {
        title: "Comisión de Tasty",
        description: '10% de los ingresos totales',
    },
    revenueOverview: 'Resumen de Ingresos',
  },
  chefOrders: {
    title: 'Gestionar Pedidos',
    description: 'Rastrea y actualiza el estado de los pedidos de tus clientes.',
    allOrdersTitle: 'Todos los Pedidos',
    allOrdersDescription: 'Una lista de todos los pedidos entrantes y pasados.',
  },
  orderTable: {
    orderId: 'ID de Pedido',
    customer: 'Cliente',
    dates: 'Fechas',
    total: 'Total',
    status: 'Estado',
    ordered: 'Pedido',
    delivery: 'Entrega',
  },
  orderStatusSelector: {
    toastTitle: 'Estado del Pedido Actualizado',
    toastDescription: (orderId: string, newStatus: string) => `El pedido ${orderId} ahora está "${newStatus}".`,
    placeholder: 'Actualizar estado',
  },
  chefProducts: {
    title: 'Mis Productos',
    description: 'Gestiona tus deliciosas creaciones.',
    addNew: 'Añadir Nuevo Producto',
  },
  productTable: {
    image: 'Imagen',
    productDetails: 'Detalles del Producto',
    type: 'Tipo',
    price: 'Precio',
    actions: 'Acciones',
    edit: 'Editar',
    delete: 'Eliminar',
  },
  chefPromotions: {
    title: 'Gestionar Promociones',
    discount: {
        title: 'Crear Descuento de Producto',
        description: 'Ofrece un descuento porcentual en un producto específico.',
    },
    freeItem: {
        title: 'Crear Oferta de "Artículo Gratis"',
        description: 'Ofrece un artículo gratis con la compra de otro.',
    },
    current: {
        title: 'Tus Promociones Actuales',
        freeItemBadge: 'Artículo Gratis',
        empty: "Aún no has creado ninguna promoción.",
    }
  },
  promotionForm: {
    title_en: { label: 'Offer Title (English)', placeholder: 'e.g., Weekend Croissant Special' },
    title_es: { label: 'Título de la Oferta (Español)', placeholder: 'e.g., Especial de Croissants del Fin de Semana' },
    description_en: { label: 'Short Description (English)', placeholder: 'A brief summary of the offer...' },
    description_es: { label: 'Descripción Corta (Español)', placeholder: 'Un resumen breve de la oferta...' },
  },
  discountForm: {
    product: { label: 'Producto a Descontar', placeholder: 'Selecciona un producto a descontar' },
    percentage: { label: 'Porcentaje de Descuento', placeholder: 'e.g., 15' },
    submit: 'Crear Descuento',
    toast: {
      title: '¡Descuento Creado!',
      description: (percentage: number, product: string) => `Un descuento del ${percentage}% para ${product} ha sido guardado (simulación).`,
    },
  },
  freeItemForm: {
    placeholders: {
      title_en: 'e.g., Croissant Combo Deal',
      title_es: 'e.g., Combo Oferta de Croissant',
      description_en: 'e.g., Buy a Quiche, get a free Croissant!',
      description_es: 'e.g., ¡Compra una Quiche y llévate un Croissant gratis!',
    },
    requiredProduct: { label: 'SI un cliente compra...', placeholder: 'Selecciona un producto' },
    freeProduct: { label: 'ENTONCES obtiene esto gratis...', placeholder: 'Selecciona el producto gratis' },
    submit: 'Crear Oferta de Artículo Gratis',
    toast: {
      title: '¡Promoción Creada!',
      description: "La nueva promoción 'Compra X, Lleva Y' ha sido guardada (simulación).",
    },
  },
  adminPromotions: {
    title: 'Gestionar Promociones',
    createTitle: 'Crear Nueva Oferta',
    currentTitle: 'Promociones Actuales',
    freeItemBadge: 'Artículo Gratis',
  },
};

export default dictionary;
