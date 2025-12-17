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
  }
};

export default dictionary;
