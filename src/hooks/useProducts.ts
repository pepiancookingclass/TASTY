'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { getProducts, getProductsByType, getProductsByCreator } from '@/lib/services/products';
import { products as staticProducts } from '@/lib/data';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await getProducts();
        // Si no hay datos en la DB, usar datos estáticos
        setProducts(data.length > 0 ? data : staticProducts);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Error loading products');
        // Fallback a datos estáticos
        setProducts(staticProducts);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error, refetch: () => {} };
}

export function useProductsByType(type: Product['type']) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await getProductsByType(type);
        if (data.length > 0) {
          setProducts(data);
        } else {
          // Fallback a datos estáticos filtrados
          setProducts(staticProducts.filter(p => p.type === type));
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setProducts(staticProducts.filter(p => p.type === type));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [type]);

  return { products, loading };
}

export function useProductsByCreator(creatorId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => {
    console.log('🔄 useProductsByCreator: refetch triggered');
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await getProductsByCreator(creatorId);
        if (data.length > 0) {
          setProducts(data);
        } else {
          // Fallback a datos estáticos filtrados
          setProducts(staticProducts.filter(p => p.creatorId === creatorId));
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setProducts(staticProducts.filter(p => p.creatorId === creatorId));
      } finally {
        setLoading(false);
      }
    }

    if (creatorId) {
      fetchProducts();
    }
  }, [creatorId, refreshKey]);

  return { products, loading, refetch };
}

