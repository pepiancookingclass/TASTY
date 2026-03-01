'use client';

import { track } from '@vercel/analytics';

export function useAnalytics() {
  // Eventos de productos
  const trackProductView = (productId: string, productName: string, creatorId: string, category: string) => {
    track('product_view', {
      product_id: productId,
      product_name: productName,
      creator_id: creatorId,
      category: category
    });
  };

  const trackProductAddToCart = (productId: string, productName: string, price: number, quantity: number) => {
    track('add_to_cart', {
      product_id: productId,
      product_name: productName,
      price: price,
      quantity: quantity,
      value: price * quantity
    });
  };

  // Eventos de creadores
  const trackCreatorView = (creatorId: string, creatorName: string) => {
    track('creator_view', {
      creator_id: creatorId,
      creator_name: creatorName
    });
  };

  // Eventos de pedidos
  const trackOrderStart = (cartValue: number, itemCount: number) => {
    track('begin_checkout', {
      value: cartValue,
      items: itemCount
    });
  };

  const trackOrderComplete = (orderId: string, value: number, itemCount: number, paymentMethod: string) => {
    track('purchase', {
      order_id: orderId,
      value: value,
      items: itemCount,
      payment_method: paymentMethod
    });
  };

  // Eventos de búsqueda
  const trackSearch = (searchTerm: string, resultsCount: number) => {
    track('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  };

  // Eventos de navegación
  const trackPageView = (pageName: string, section?: string) => {
    track('page_view', {
      page_name: pageName,
      section: section
    });
  };

  // Eventos de usuario
  const trackUserRegistration = (method: string) => {
    track('sign_up', {
      method: method
    });
  };

  const trackUserLogin = (method: string) => {
    track('login', {
      method: method
    });
  };

  // Eventos de ofertas
  const trackOfferView = (offerId: string, offerType: string, discount: number) => {
    track('offer_view', {
      offer_id: offerId,
      offer_type: offerType,
      discount_percentage: discount
    });
  };

  const trackOfferClick = (offerId: string, offerType: string) => {
    track('offer_click', {
      offer_id: offerId,
      offer_type: offerType
    });
  };

  // Eventos de contacto
  const trackWhatsAppClick = (context: string, creatorId?: string) => {
    track('whatsapp_click', {
      context: context,
      creator_id: creatorId
    });
  };

  const trackInstagramClick = (creatorId: string, creatorName: string) => {
    track('instagram_click', {
      creator_id: creatorId,
      creator_name: creatorName
    });
  };

  return {
    trackProductView,
    trackProductAddToCart,
    trackCreatorView,
    trackOrderStart,
    trackOrderComplete,
    trackSearch,
    trackPageView,
    trackUserRegistration,
    trackUserLogin,
    trackOfferView,
    trackOfferClick,
    trackWhatsAppClick,
    trackInstagramClick
  };
}




