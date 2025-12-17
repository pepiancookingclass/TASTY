const dictionary = {
  hero: {
    headline: 'Artisan Flavors, Straight From Home',
    subheadline:
      'Discover unique, handcrafted dishes made with passion by local chefs.',
    cta: 'Explore Now',
  },
  chefShowcase: {
    headline: 'Meet Our Chefs',
    tagline: 'The heart and soul behind our homemade delights.',
    specialty: 'Specializing in pastries and lovingly baked treats.',
    viewProfile: 'View Profile',
    productCount: (count: number) => `${count} products`,
  },
  promotionsBanner: {
    title: 'Special Offers',
  },
  productShowcase: {
    sweets: 'Sweets',
    savory: 'Savory',
    noProductsMatch: 'No products match your filters.',
    tryAdjusting: 'Try adjusting your selection to find more delights!',
    filters: {
      glutenFree: 'Gluten-Free',
      vegan: 'Vegan',
      dairyFree: 'Dairy-Free',
      nutFree: 'Nut-Free',
    }
  },
  productCard: {
    addToCart: 'Add to Cart',
    addedToCart: 'Added to cart!',
    inYourCart: (productName: string) => `${productName} is now in your shopping cart.`,
    by: 'By',
  },
  cartView: {
    empty: {
      title: 'Your cart is empty',
      description: "Looks like you haven't added anything to your cart yet.",
      cta: 'Start Shopping'
    },
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    platformFee: 'Platform Fee (10%)',
    deliveryFee: 'Delivery Fee',
    total: 'Total',
    estimatedDelivery: 'Estimated Delivery:',
    preparationTime: (hours: number) => `Based on ${hours}hr preparation time.`,
    proceedToCheckout: 'Proceed to Checkout',
    checkoutModal: {
      title: 'Heads up!',
      description: (hours: number, date: string) => `Your order requires up to ${hours} hours of preparation. The estimated delivery time is ${date}. Please plan accordingly!`,
      cancel: 'Cancel',
      continue: 'Continue',
    }
  },
  siteHeader: {
    home: 'Home',
    sweets: 'Sweets',
    savory: 'Savory',
    chefs: 'Chefs',
    chefDashboard: 'Chef Dashboard',
    changeLanguage: 'Change language',
    shoppingCart: 'Shopping Cart',
    profile: 'Profile',
    admin: 'Admin',
    logout: 'Log out',
    signup: 'Sign Up',
    login: 'Login',
  },
  chefSidebar: {
    title: 'Chef Portal',
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    promotions: 'Promotions',
    backToStore: 'Back to Store',
  },
  orderStatuses: {
    new: 'New',
    preparing: 'In Preparation',
    ready: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  },
  chefDashboard: {
    totalRevenue: {
        title: 'Total Revenue',
        description: 'From completed orders',
    },
    activeOrders: {
        title: 'Active Orders',
        description: 'New or in preparation',
    },
    completedOrders: {
        title: 'Completed Orders',
        description: 'All-time delivered orders',
    },
    commission: {
        title: "Tasty's Commission",
        description: '10% of total revenue',
    },
    revenueOverview: 'Revenue Overview',
  },
  chefOrders: {
    title: 'Manage Orders',
    description: 'Track and update the status of your customer orders.',
    allOrdersTitle: 'All Orders',
    allOrdersDescription: 'A list of all incoming and past orders.',
  },
  orderTable: {
    orderId: 'Order ID',
    customer: 'Customer',
    dates: 'Dates',
    total: 'Total',
    status: 'Status',
    ordered: 'Ordered',
    delivery: 'Delivery',
  },
  orderStatusSelector: {
    toastTitle: 'Order Status Updated',
    toastDescription: (orderId: string, newStatus: string) => `Order ${orderId} is now "${newStatus}".`,
    placeholder: 'Update status',
  },
  chefProducts: {
    title: 'My Products',
    description: 'Manage your delicious creations.',
    addNew: 'Add New Product',
  },
  productTable: {
    image: 'Image',
    productDetails: 'Product Details',
    type: 'Type',
    price: 'Price',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
  },
  chefPromotions: {
    title: 'Manage Promotions',
    discount: {
        title: 'Create Product Discount',
        description: 'Offer a percentage discount on a specific product.',
    },
    freeItem: {
        title: 'Create "Free Item" Offer',
        description: 'Offer a free item with the purchase of another.',
    },
    current: {
        title: 'Your Current Promotions',
        freeItemBadge: 'Free Item',
        empty: "You haven't created any promotions yet.",
    }
  },
  promotionForm: {
    title_en: { label: 'Offer Title (English)', placeholder: 'e.g., Weekend Croissant Special' },
    title_es: { label: 'Título de la Oferta (Español)', placeholder: 'e.g., Especial de Croissants del Fin de Semana' },
    description_en: { label: 'Short Description (English)', placeholder: 'A brief summary of the offer...' },
    description_es: { label: 'Descripción Corta (Español)', placeholder: 'Un resumen breve de la oferta...' },
  },
  discountForm: {
    product: { label: 'Product to Discount', placeholder: 'Select a product to discount' },
    percentage: { label: 'Discount Percentage', placeholder: 'e.g., 15' },
    submit: 'Create Discount',
    toast: {
      title: 'Discount Created!',
      description: (percentage: number, product: string) => `A ${percentage}% discount for ${product} has been saved (simulation).`,
    },
  },
  freeItemForm: {
    placeholders: {
      title_en: 'e.g., Croissant Combo Deal',
      title_es: 'e.g., Combo Oferta de Croissant',
      description_en: 'e.g., Buy a Quiche, get a free Croissant!',
      description_es: 'e.g., ¡Compra una Quiche y llévate un Croissant gratis!',
    },
    requiredProduct: { label: 'IF a customer buys...', placeholder: 'Select a product' },
    freeProduct: { label: 'THEN they get this for free...', placeholder: 'Select freebie product' },
    submit: 'Create Free Item Offer',
    toast: {
      title: 'Promotion Created!',
      description: "The new 'Buy X, Get Y' promotion has been saved (simulation).",
    },
  },
  adminPromotions: {
    title: 'Manage Promotions',
    createTitle: 'Create New Offer',
    currentTitle: 'Current Promotions',
    freeItemBadge: 'Free Item',
  },
};

export default dictionary;
