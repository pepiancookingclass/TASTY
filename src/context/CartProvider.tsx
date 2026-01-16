'use client';

import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string } // productId
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'RESTORE_CART'; payload: CartState }
  | { type: 'CLEAR_CART' };

// ✅ FASE 2: Función para backup silencioso en base de datos
const backupCartToDatabase = async (state: CartState, userId?: string) => {
  if (!userId || state.items.length === 0) return;
  
  try {
    console.log('🗄️ CartProvider: Haciendo backup silencioso en BD para usuario:', userId);
    console.log('📊 CartProvider: Items a guardar en BD:', state.items.length, 'items:', state.items);
    
    const dataToSave = {
      user_id: userId,
      cart_data: state.items
    };
    
    console.log('💾 CartProvider: Datos completos a enviar:', dataToSave);
    
    const { error } = await supabase
      .from('user_carts')
      .upsert(dataToSave, { 
        onConflict: 'user_id' 
      });

    if (error) {
      console.error('❌ CartProvider: Error en backup BD:', error);
    } else {
      console.log('✅ CartProvider: Backup en BD exitoso - Guardados', state.items.length, 'items');
    }
  } catch (error) {
    console.error('❌ CartProvider: Error haciendo backup:', error);
  }
};

// ✅ FASE 2: Función para restaurar carrito desde BD
const restoreCartFromDatabase = async (userId: string): Promise<CartItem[] | null> => {
  try {
    console.log('🔍 CartProvider: Buscando carrito guardado en BD para usuario:', userId);
    
    const { data, error } = await supabase
      .from('user_carts')
      .select('cart_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📭 CartProvider: No hay carrito guardado en BD');
        return null;
      }
      console.error('❌ CartProvider: Error restaurando carrito:', error);
      return null;
    }

    if (data?.cart_data && Array.isArray(data.cart_data)) {
      console.log('✅ CartProvider: Carrito encontrado en BD:', data.cart_data);
      return data.cart_data;
    }

    return null;
  } catch (error) {
    console.error('❌ CartProvider: Error restaurando carrito:', error);
    return null;
  }
};

// ✅ MEJORADO: Función para guardar carrito con triple persistencia
const saveCartToStorage = async (state: CartState, userId?: string) => {
  if (typeof window === 'undefined') return;
  
  try {
    const cartData = JSON.stringify(state);
    
    // 1. Guardar en localStorage Y sessionStorage (inmediato)
    localStorage.setItem('tasty-cart', cartData);
    sessionStorage.setItem('tasty-cart-backup', cartData);
    
    console.log('💾 CartProvider: Carrito guardado en storages [' + new Date().toISOString() + ']:', state);
    console.log('💾 CartProvider: localStorage:', localStorage.getItem('tasty-cart') ? 'OK' : 'VACÍO');
    console.log('💾 CartProvider: sessionStorage:', sessionStorage.getItem('tasty-cart-backup') ? 'OK' : 'VACÍO');
    
    // 2. Backup silencioso en BD (si está logueado)
    if (userId) {
      backupCartToDatabase(state, userId);
    }
  } catch (error) {
    console.error('❌ CartProvider: Error guardando carrito:', error);
  }
};

// Estado inicial vacío para evitar hidratación
const initialState: CartState = { items: [] };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newState: CartState;
  
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        (item) => item.product.id === action.payload.id
      );
      if (existingItem) {
        newState = {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        newState = {
          ...state,
          items: [...state.items, { product: action.payload, quantity: 1 }],
        };
      }
      break;
    }
    case 'REMOVE_ITEM': {
      newState = {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload),
      };
      break;
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        newState = {
          ...state,
          items: state.items.filter(
            (item) => item.product.id !== action.payload.productId
          ),
        };
      } else {
        newState = {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.productId
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
        };
      }
      break;
    }
    case 'RESTORE_CART':
      // ✅ MEJORADO: Restaurar sin triggear save (para evitar loops)
      return action.payload;
    case 'CLEAR_CART':
      newState = { ...state, items: [] };
      break;
    default:
      return state;
  }
  
  // Guardar en localStorage después de cada cambio (sin userId aquí)
  if (typeof window !== 'undefined') {
    const cartData = JSON.stringify(newState);
    localStorage.setItem('tasty-cart', cartData);
    sessionStorage.setItem('tasty-cart-backup', cartData);
  }
  return newState;
};

export const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  isLoaded: boolean;
} | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { user } = useAuth(); // ✅ FASE 2: Obtener usuario para backup

  // ✅ MEJORADO: Cargar carrito con doble persistencia
  useEffect(() => {
    console.log('🔄 CartProvider: useEffect ejecutándose - Componente reinicializado');
    
    if (typeof window !== 'undefined') {
      try {
        // ✅ VERIFICAR SI EL CARRITO FUE LIMPIADO INTENCIONALMENTE (después de compra)
        const wasCleared = sessionStorage.getItem('tasty-cart-cleared');
        if (wasCleared === 'true') {
          console.log('🚫 CartProvider: Carrito fue limpiado después de compra, NO restaurar');
          // NO remover la flag aquí, se remueve en el otro useEffect
          setIsLoaded(true);
          return;
        }
        
        let savedCart = localStorage.getItem('tasty-cart');
        let backupCart = sessionStorage.getItem('tasty-cart-backup');
        
        console.log('🔍 CartProvider: Verificando AMBOS storages [' + new Date().toISOString() + ']:', { 
          localStorage: savedCart ? 'TIENE DATOS' : 'VACÍO',
          sessionStorage: backupCart ? 'TIENE DATOS' : 'VACÍO'
        });
        
        // Usar localStorage primero, sessionStorage como backup
        let cartToUse = savedCart || backupCart;
        let source = savedCart ? 'localStorage' : 'sessionStorage';
        
        if (cartToUse && cartToUse !== 'undefined' && cartToUse !== 'null') {
          const parsedCart = JSON.parse(cartToUse);
          console.log(`🛒 CartProvider: Carrito encontrado en ${source}:`, parsedCart);
          
          // Validar que el carrito tenga la estructura correcta
          if (parsedCart && Array.isArray(parsedCart.items) && parsedCart.items.length > 0) {
            console.log(`✅ CartProvider: Restaurando carrito válido desde ${source} con`, parsedCart.items.length, 'items');
            dispatch({ type: 'RESTORE_CART', payload: { items: parsedCart.items } });
            
            // Si recuperamos desde sessionStorage, guardar en localStorage también
            if (source === 'sessionStorage') {
              console.log('🔄 CartProvider: Sincronizando sessionStorage → localStorage');
              localStorage.setItem('tasty-cart', cartToUse);
            }
          } else {
            console.log('📭 CartProvider: Carrito vacío o inválido, no restaurar');
          }
        } else {
          console.log('🛒 CartProvider: No hay carrito en NINGÚN storage');
        }
      } catch (error) {
        console.error('❌ CartProvider: Error cargando carrito:', error);
        // En caso de error, limpiar ambos storages
        localStorage.removeItem('tasty-cart');
        sessionStorage.removeItem('tasty-cart-backup');
      }
      setIsLoaded(true);
    }
  }, []);

  // ✅ FASE 2: Restaurar carrito desde BD cuando usuario se loguea
  useEffect(() => {
    const restoreCartOnLogin = async () => {
      if (!user?.id || !isLoaded) return;
      
      // ✅ VERIFICAR SI EL CARRITO FUE LIMPIADO INTENCIONALMENTE (después de compra)
      if (typeof window !== 'undefined') {
        const wasCleared = sessionStorage.getItem('tasty-cart-cleared');
        if (wasCleared === 'true') {
          console.log('🚫 CartProvider: Carrito fue limpiado intencionalmente, NO restaurar');
          sessionStorage.removeItem('tasty-cart-cleared'); // Limpiar flag
          return;
        }
      }
      
      console.log('👤 CartProvider: Usuario logueado, verificando carrito en BD...');
      
      const dbCartItems = await restoreCartFromDatabase(user.id);
      const localCartItems = state.items;
      
      if (dbCartItems && dbCartItems.length > 0) {
        if (localCartItems.length === 0) {
          // Caso 1: No hay carrito local, restaurar desde BD
          console.log('📥 CartProvider: Restaurando carrito completo desde BD');
          dispatch({ type: 'RESTORE_CART', payload: { items: dbCartItems } });
        } else {
          // Caso 2: Hay carrito local Y en BD - por ahora solo loguear
          console.log('🔄 CartProvider: Carrito local existe, BD también - manteniendo local por ahora');
          console.log('📊 CartProvider: Local:', localCartItems.length, 'items, BD:', dbCartItems.length, 'items');
          // TODO: Implementar merge dialog en futuras versiones
        }
      } else {
        console.log('📭 CartProvider: No hay carrito en BD, manteniendo local');
      }
    };

    restoreCartOnLogin();
  }, [user?.id, isLoaded]);

  // ✅ FASE 2: Backup automático en BD cuando cambia el carrito
  useEffect(() => {
    if (isLoaded && user?.id && state.items.length > 0) {
      console.log('🔄 CartProvider: Carrito cambió, haciendo backup en BD...');
      backupCartToDatabase(state, user.id);
    }
  }, [state.items, user?.id, isLoaded]);

  return (
    <CartContext.Provider value={{ state, dispatch, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
};
