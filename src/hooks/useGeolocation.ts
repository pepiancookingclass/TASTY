'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
  location: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false
  });

  const getLocation = () => {
    console.log('📍 useGeolocation: getLocation() llamado [' + new Date().toISOString() + ']');
    
    if (!navigator.geolocation) {
      console.log('❌ useGeolocation: Navegador no soporta geolocalización');
      setState(prev => ({
        ...prev,
        error: 'Geolocalización no soportada por este navegador',
        loading: false
      }));
      return;
    }

    console.log('🔄 useGeolocation: Iniciando getCurrentPosition con timeout de 30s...');
    console.log('⏰ useGeolocation: Si no ves respuesta en 30s, entonces el timeout sigue siendo insuficiente');
    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ useGeolocation: Ubicación obtenida exitosamente:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = 'Error obteniendo ubicación';
        
        console.log('❌ useGeolocation: Error en getCurrentPosition:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        });
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados';
            console.log('🚫 useGeolocation: Usuario denegó permisos de ubicación');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            console.log('📍 useGeolocation: Ubicación no disponible (GPS apagado?)');
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            console.log('⏰ useGeolocation: Timeout obteniendo ubicación');
            break;
        }

        setState({
          location: null,
          error: errorMessage,
          loading: false
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // ✅ AUMENTADO: 30 segundos para GPS lento
        maximumAge: 300000 // 5 minutos
      }
    );
  };

  return {
    ...state,
    getLocation
  };
}




