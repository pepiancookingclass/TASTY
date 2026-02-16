'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useUserRoles } from '@/hooks/useUserRoles';

const STORAGE_KEY = 'tasty_visitor_id';

// Generar visitor ID único persistente
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem(STORAGE_KEY);
  
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, visitorId);
  }
  
  return visitorId;
}

// Obtener UTM params de URL
function getUTMParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
}

interface TrackEventParams {
  eventType: 'page_view' | 'product_view' | 'creator_view' | 'add_to_cart' | 'checkout' | 'purchase' | 'search';
  pagePath?: string;
  entityType?: 'product' | 'creator' | 'combo' | 'page';
  entityId?: string;
  entityName?: string;
  productCategory?: string;
  productPrice?: number;
  creatorId?: string;
  creatorName?: string;
  orderId?: string;
  orderTotal?: number;
  itemsCount?: number;
}

export function useVisitorAnalytics() {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const visitorIdRef = useRef<string>('');
  const hasTrackedPageView = useRef<string>('');
  
  // Inicializar visitor ID
  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);
  
  // Verificar si debe trackear (NO trackear admins/creators/agents)
  const shouldTrack = useCallback((): boolean => {
    // No trackear si es admin, creator o agent - solo clientes reales (user/customer)
    // Nota: 'user' y 'customer' son ambos roles de cliente (inconsistencia histórica)
    if (roles?.includes('admin') || roles?.includes('creator') || roles?.includes('agent')) {
      return false;
    }
    return true;
  }, [roles]);
  
  // Función principal para trackear eventos
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    // No trackear admins/creators
    if (!shouldTrack()) {
      console.log('📊 Analytics: Skipping (admin/creator)');
      return;
    }
    
    // Asegurar que tenemos visitor ID
    if (!visitorIdRef.current) {
      visitorIdRef.current = getVisitorId();
    }
    
    try {
      const utmParams = getUTMParams();
      
      const payload = {
        visitor_id: visitorIdRef.current,
        user_id: user?.id || null,
        event_type: params.eventType,
        page_path: params.pagePath || (typeof window !== 'undefined' ? window.location.pathname : null),
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        product_category: params.productCategory,
        product_price: params.productPrice,
        creator_id: params.creatorId,
        creator_name: params.creatorName,
        order_id: params.orderId,
        order_total: params.orderTotal,
        items_count: params.itemsCount,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        ...utmParams,
      };
      
      // Fire and forget - no esperar respuesta
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silenciar errores - analytics no debe afectar UX
      });
      
      console.log('📊 Analytics tracked:', params.eventType, params.entityName || params.pagePath);
      
    } catch (error) {
      // Silenciar errores
      console.error('📊 Analytics error (silenced):', error);
    }
  }, [user, shouldTrack]);
  
  // Trackear page view automáticamente
  const trackPageView = useCallback((pagePath?: string) => {
    const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    // Evitar duplicados en la misma página
    if (hasTrackedPageView.current === path) {
      return;
    }
    hasTrackedPageView.current = path;
    
    trackEvent({
      eventType: 'page_view',
      pagePath: path,
      entityType: 'page',
    });
  }, [trackEvent]);
  
  // Trackear vista de producto
  const trackProductView = useCallback((product: {
    id: string;
    name: string;
    category?: string;
    price?: number;
    creatorId?: string;
    creatorName?: string;
  }) => {
    trackEvent({
      eventType: 'product_view',
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      productCategory: product.category,
      productPrice: product.price,
      creatorId: product.creatorId,
      creatorName: product.creatorName,
    });
  }, [trackEvent]);
  
  // Trackear vista de creator
  const trackCreatorView = useCallback((creator: {
    id: string;
    name: string;
  }) => {
    trackEvent({
      eventType: 'creator_view',
      entityType: 'creator',
      entityId: creator.id,
      entityName: creator.name,
    });
  }, [trackEvent]);
  
  // Trackear add to cart
  const trackAddToCart = useCallback((product: {
    id: string;
    name: string;
    price?: number;
    creatorId?: string;
    creatorName?: string;
  }) => {
    trackEvent({
      eventType: 'add_to_cart',
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      productPrice: product.price,
      creatorId: product.creatorId,
      creatorName: product.creatorName,
    });
  }, [trackEvent]);
  
  // Trackear checkout iniciado
  const trackCheckout = useCallback((data: {
    itemsCount: number;
    totalAmount: number;
  }) => {
    trackEvent({
      eventType: 'checkout',
      itemsCount: data.itemsCount,
      orderTotal: data.totalAmount,
    });
  }, [trackEvent]);
  
  // Trackear compra completada
  const trackPurchase = useCallback((order: {
    id: string;
    total: number;
    itemsCount: number;
  }) => {
    trackEvent({
      eventType: 'purchase',
      orderId: order.id,
      orderTotal: order.total,
      itemsCount: order.itemsCount,
    });
  }, [trackEvent]);
  
  return {
    trackEvent,
    trackPageView,
    trackProductView,
    trackCreatorView,
    trackAddToCart,
    trackCheckout,
    trackPurchase,
  };
}
