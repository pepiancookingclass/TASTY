'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/providers/auth-provider';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShoppingBag, MapPin, Clock, CreditCard, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';
import { addHours, format } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/lib/services/orders';
import { useRouter } from 'next/navigation';
import { DeliveryMap } from '@/components/ui/delivery-map';
import { LocationSelector } from '@/components/ui/location-selector';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/lib/supabase';
import { useDictionary } from '@/hooks/useDictionary';
import { Input as UITextInput } from '@/components/ui/input';
import { validateAddressDistance } from '@/lib/validate-address-distance';

const DELIVERY_DATETIME_KEY = 'tasty-delivery-datetime';
const ADDRESS_DISTANCE_THRESHOLD_KM = 0.5;
const WHATSAPP_SUPPORT_URL = 'https://wa.me/50230635323';

// Datos de Guatemala (mismo que en perfil)
const GUATEMALA_DEPARTMENTS = {
  'Guatemala': [
    'Guatemala', 'Mixco', 'Villa Nueva', 'Petapa', 'San José Pinula', 'San José del Golfo',
    'Palencia', 'Chinautla', 'San Pedro Ayampuc', 'San Pedro Sacatepéquez', 'San Juan Sacatepéquez',
    'San Raymundo', 'Chuarrancho', 'Fraijanes', 'Amatitlán', 'Villa Canales', 'Santa Catarina Pinula'
  ],
  'Sacatepéquez': [
    'Antigua Guatemala', 'Jocotenango', 'Pastores', 'Sumpango', 'Santo Domingo Xenacoj',
    'Santiago Sacatepéquez', 'San Bartolomé Milpas Altas', 'San Lucas Sacatepéquez',
    'Santa Lucía Milpas Altas', 'Magdalena Milpas Altas', 'Santa María de Jesús',
    'Ciudad Vieja', 'San Miguel Dueñas', 'Alotenango', 'San Antonio Aguas Calientes', 'Santa Catarina Barahona'
  ]
};

export default function CheckoutPage() {
  const { state, dispatch } = useCart();
  const { items } = state;
  const { language } = useLanguage();
  const { user: authUser } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const dict = useDictionary();
  const t = dict.checkout;

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryDateInput, setDeliveryDateInput] = useState<string>('');
  
  // Estados para opciones de privacidad
  const [saveLocationData, setSaveLocationData] = useState(false);
  const [autoDeleteAfterDelivery, setAutoDeleteAfterDelivery] = useState(true);
  
  // Datos de entrega
  const safeUser: any = user || {};
  const [deliveryData, setDeliveryData] = useState({
    name: safeUser.displayName || '',
    phone: safeUser.phone || '',
    email: safeUser.email || '',
    street: safeUser.address_street || '',
    department: safeUser.address_state || '',
    municipality: safeUser.address_city || '',
    notes: ''
  });

  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>(
    deliveryData.department ? GUATEMALA_DEPARTMENTS[deliveryData.department as keyof typeof GUATEMALA_DEPARTMENTS] || [] : []
  );

  // Estados para delivery dinámico
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const { location: userLocation, error: locationError, loading: isGettingLocation, getLocation } = useGeolocation();
  
  // Estado para delivery breakdown
  const [deliveryBreakdown, setDeliveryBreakdown] = useState<Array<{
    creator_id: string;
    creator_name: string;
    creator_zone: string;
    delivery_fee: number;
    distance_km: number;
    vehicle?: string;
  }>>([]);
  const [addressValidation, setAddressValidation] = useState<{
    state: 'idle' | 'checking' | 'ok' | 'blocked' | 'pending_verification';
    distanceKm?: number;
    message?: string;
  }>({ state: 'idle' });
  
  // Warning para distancias largas (>50km)
  const [longDistanceWarning, setLongDistanceWarning] = useState<{
    show: boolean;
    maxDistance?: number;
    creatorName?: string;
  }>({ show: false });
  
  // Info de creadores (nombre y zona) para el resumen
  const [creatorInfoMap, setCreatorInfoMap] = useState<Record<string, { name: string; zone: string }>>({});
  
  // Estado para ubicación manual
  const [manualLocation, setManualLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const finalLocation = userLocation || manualLocation;

  // Si el usuario cambia dirección o ubicación, limpiar bloqueo para permitir revalidar
  useEffect(() => {
    setAddressValidation((prev) => (prev.state === 'blocked' ? { state: 'idle' } : prev));
  }, [deliveryData.street, deliveryData.municipality, deliveryData.department, finalLocation?.lat, finalLocation?.lng]);

  // Cargar info de creadores (nombre y zona) para el resumen
  useEffect(() => {
    const loadCreatorInfo = async () => {
      const creatorIds = [...new Set(items.map(item => item.product.creatorId))];
      if (creatorIds.length === 0) return;
      
      const { data } = await supabase
        .from('users')
        .select('id, name, address_city, address_state')
        .in('id', creatorIds);
      
      const info: Record<string, { name: string; zone: string }> = {};
      (data || []).forEach((c: { id: string; name?: string; address_city?: string; address_state?: string }) => {
        const parts = [c.address_city, c.address_state].filter(Boolean);
        info[c.id] = {
          name: c.name || 'Creador',
          zone: parts.join(', ') || ''
        };
      });
      setCreatorInfoMap(info);
    };
    loadCreatorInfo();
  }, [items]);

  // Cálculos
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const ivaRate = 0.12; // 12% IVA
  const ivaAmount = subtotal * ivaRate;
  const subtotalWithIva = subtotal + ivaAmount;
  const total = subtotalWithIva + (deliveryFee || 0);

  const maxPreparationTime = Math.max(...items.map(item => item.product.preparationTime), 0);
  
  // Política de 48 horas: la entrega debe ser mínimo 48 horas después del pedido
  const minimumDeliveryTime = 48; // horas
  const estimatedDeliveryDate = addHours(new Date(), minimumDeliveryTime);
  const dateLocale = language === 'es' ? esLocale : enUS;
  const dateFormatString = language === 'es' ? "EEEE, dd 'de' MMMM 'a las' HH:mm" : "EEEE, MMM dd 'at' HH:mm";
  const formattedDeliveryDate = format(estimatedDeliveryDate, dateFormatString, { locale: dateLocale });

  const formatForInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const minimumDeliveryInput = formatForInput(estimatedDeliveryDate);

  // Prefill fecha de entrega desde carrito o default 48h
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(DELIVERY_DATETIME_KEY);
    if (saved) {
      const savedDate = new Date(saved);
      // Si lo guardado es inválido o anterior al mínimo, forzar mínimo
      if (isNaN(savedDate.getTime()) || savedDate.getTime() < estimatedDeliveryDate.getTime()) {
        setDeliveryDateInput(minimumDeliveryInput);
        localStorage.setItem(DELIVERY_DATETIME_KEY, minimumDeliveryInput);
      } else {
        setDeliveryDateInput(saved);
      }
    } else {
      setDeliveryDateInput(minimumDeliveryInput);
      localStorage.setItem(DELIVERY_DATETIME_KEY, minimumDeliveryInput);
    }
  }, [minimumDeliveryInput, estimatedDeliveryDate]);

  const getSelectedDeliveryDate = () => {
    if (deliveryDateInput) {
      const d = new Date(deliveryDateInput);
      if (!isNaN(d.getTime())) return d;
    }
    return estimatedDeliveryDate;
  };

  const formatSelectedDateDisplay = () => {
    const d = getSelectedDeliveryDate();
    return format(d, dateFormatString, { locale: dateLocale });
  };

  // Asegurar que los municipios se llenen cuando el departamento viene prellenado
  useEffect(() => {
    if (!deliveryData.department) return;
    const municipalities = GUATEMALA_DEPARTMENTS[deliveryData.department as keyof typeof GUATEMALA_DEPARTMENTS] || [];
    setAvailableMunicipalities(municipalities);
  }, [deliveryData.department]);

  // Prefill datos de entrega cuando el perfil llega y los campos están vacíos
  useEffect(() => {
    if (!user) return;

    setDeliveryData(prev => {
      const next = {
        name: prev.name || user.displayName || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        street: prev.street || user.address_street || '',
        department: prev.department || user.address_state || '',
        municipality: prev.municipality || user.address_city || '',
        notes: prev.notes || ''
      };

      const isSame =
        prev.name === next.name &&
        prev.phone === next.phone &&
        prev.email === next.email &&
        prev.street === next.street &&
        prev.department === next.department &&
        prev.municipality === next.municipality &&
        prev.notes === next.notes;

      return isSame ? prev : next;
    });
  }, [user?.uid, user?.displayName, user?.email, user?.phone, user?.address_street, user?.address_state, user?.address_city]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(price);
  };

  const runAddressValidation = async () => {
    if (!(finalLocation && deliveryData.street && deliveryData.department && deliveryData.municipality)) {
      return { ok: true };
    }
    setAddressValidation({ state: 'checking' });
    const validation = await validateAddressDistance(
      {
        street: deliveryData.street,
        municipality: deliveryData.municipality,
        department: deliveryData.department,
        country: 'Guatemala',
      },
      { lat: finalLocation.lat, lng: finalLocation.lng },
      ADDRESS_DISTANCE_THRESHOLD_KM
    );
    console.log('📍 Checkout: resultado validación dirección', validation);
    // Ya no bloqueamos - siempre permitir continuar con pending_verification
    // Servicio al cliente verificará la ubicación y dirección
    if (!validation.ok) {
      setAddressValidation({
        state: 'pending_verification',
        distanceKm: validation.distanceKm,
        message: validation.warning || validation.error || '',
      });
      // Solo log, no toast destructivo - el mensaje de aviso ya está visible en el checkout
      console.log('📍 Checkout: Validación con diferencia, marcando como pending_verification');
      return { ok: true }; // Permitir continuar
    }
    
    // Si hay warning (timeout, error de red), permitir pero marcar para verificación
    if (validation.warning) {
      setAddressValidation({
        state: 'pending_verification',
        distanceKm: validation.distanceKm,
        message: validation.warning,
      });
      toast({
        title: dict.addressValidation?.pendingVerificationTitle ?? "📋 Verificación pendiente",
        description: dict.addressValidation?.pendingVerificationBody ?? "Tu fecha y dirección de entrega será verificada por nuestro equipo de servicio al cliente.",
      });
      return { ok: true };
    }
    
    setAddressValidation({
      state: 'ok',
      distanceKm: validation.distanceKm,
      message: undefined,
    });
    return { ok: true };
  };

  const handleDepartmentChange = (department: string) => {
    setDeliveryData(prev => ({ ...prev, department, municipality: '' }));
    const municipalities = GUATEMALA_DEPARTMENTS[department as keyof typeof GUATEMALA_DEPARTMENTS] || [];
    setAvailableMunicipalities(municipalities);
  };

  const updateDeliveryField = (field: string, value: string) => {
    setDeliveryData(prev => ({ ...prev, [field]: value }));
  };

  // Callback para actualizar tarifa de delivery
  const handleDeliveryFeeCalculated = (fee: number, distance?: number) => {
    setDeliveryFee(fee);
    setIsCalculatingDelivery(false);
  };

  // Efecto para calcular delivery cuando se selecciona ubicación
  useEffect(() => {
    console.log('🔄 Checkout: useEffect delivery ejecutándose con:', {
      finalLocation: !!finalLocation,
      department: deliveryData.department,
      municipality: deliveryData.municipality,
      shouldCalculate: !!(finalLocation && deliveryData.department && deliveryData.municipality)
    });
    
    if (finalLocation && deliveryData.department && deliveryData.municipality) {
      console.log('✅ Checkout: Condiciones cumplidas, iniciando cálculo de delivery...');
      console.log('📍 Checkout: Usando ubicación:', manualLocation ? 'MANUAL' : 'GPS');
      setIsCalculatingDelivery(true);
      
      // ✅ NUEVO: Usar función SQL que valida radio de entrega
      setTimeout(async () => {
        try {
          console.log('💰 Checkout: Calculando delivery con validación de distancia para ubicación:', finalLocation);
          console.log('🛒 Checkout: Items en carrito:', items.length);
          console.log('🏪 Checkout: Productos por creador:', items.map(item => ({
            productName: item.product.name,
            creatorId: item.product.creatorId,
            quantity: item.quantity
          })));
          
          // Obtener creadores únicos del carrito
          const creatorIds = [...new Set(items.map(item => item.product.creatorId))];
          console.log('👥 Checkout: Creadores únicos encontrados:', creatorIds);
          console.log('📍 Checkout: Ubicación final del cliente:', {
            lat: finalLocation.lat,
            lng: finalLocation.lng,
            source: userLocation ? 'GPS' : 'Manual'
          });
          
          // Obtener nombres y zonas de creadores
          const { data: creatorsData } = await supabase
            .from('users')
            .select('id, name, address_city, address_state')
            .in('id', creatorIds);
          const creatorNames: Record<string, string> = {};
          const creatorZones: Record<string, string> = {};
          (creatorsData || []).forEach((c: { id: string; name: string; address_city?: string; address_state?: string }) => {
            creatorNames[c.id] = c.name || 'Creador';
            // Zona: "Ciudad, Departamento" o solo uno si el otro no existe
            const parts = [c.address_city, c.address_state].filter(Boolean);
            creatorZones[c.id] = parts.join(', ') || '';
          });
          console.log('👤 Checkout: Nombres de creadores:', creatorNames);
          console.log('📍 Checkout: Zonas de creadores:', creatorZones);
          
          let totalDeliveryFee = 0;
          let allCreatorsWithinRange = true;
          const deliveryResults: Array<{
            creatorId: string;
            creator_name: string;
            creator_zone: string;
            delivery_fee: string;
            distance_km: string;
            creator_location: string;
            is_within_radius: boolean;
            vehicle_used: string;
          }> = [];
          
          // ✅ OBTENER delivery_vehicle ACTUAL desde BD para todos los productos del carrito
          const allProductIds = items.map(i => i.product.id);
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('products')
            .select('id, delivery_vehicle')
            .in('id', allProductIds);
          
          const vehicleMap: Record<string, string> = {};
          if (vehicleData && !vehicleError) {
            vehicleData.forEach((p: { id: string; delivery_vehicle: string | null }) => {
              vehicleMap[p.id] = p.delivery_vehicle || 'moto';
            });
            console.log('🚗 Checkout: Mapa de vehículos desde BD:', vehicleMap);
          } else {
            console.warn('⚠️ Checkout: No se pudo obtener delivery_vehicle desde BD, usando valores del carrito');
          }
          
          // Calcular delivery por cada creador usando función SQL
          for (const creatorId of creatorIds) {
            console.log(`🚚 Checkout: Calculando delivery para creador ${creatorId}`);
            console.log(`📍 Checkout: Ubicación cliente:`, { lat: finalLocation.lat, lng: finalLocation.lng });
            
            // Determinar vehículo para este creador: si al menos un producto requiere auto, usar auto
            const creatorItems = items.filter(item => item.product.creatorId === creatorId);
            console.log('🛠️ DEBUG delivery vehicles -> items por creador (usando BD)', {
              creatorId,
              items: creatorItems.map(i => ({
                id: i.product.id,
                name: i.product.name?.es ?? i.product.name?.en,
                deliveryVehicle_fromCart: i.product.deliveryVehicle || 'moto (default)',
                deliveryVehicle_fromDB: vehicleMap[i.product.id] || 'moto (default)'
              }))
            });
            // ✅ USAR vehicleMap (datos frescos de BD) en lugar del valor posiblemente obsoleto del carrito
            const requiresAuto = creatorItems.some(item => vehicleMap[item.product.id] === 'auto');
            const vehicleForCreator = requiresAuto ? 'auto' : 'moto';
            console.log(`🚗 Checkout: Vehículo determinado para creador ${creatorId}: ${vehicleForCreator} (requiresAuto=${requiresAuto})`);
            
            const { data, error } = await supabase
              .rpc('calculate_creator_delivery_fee', {
                creator_uuid: creatorId,
                client_latitude: finalLocation.lat,
                client_longitude: finalLocation.lng,
                vehicle: vehicleForCreator
              });

            console.log(`🔍 Checkout: Respuesta SQL para creador ${creatorId}:`, { data, error });

            if (error) {
              console.error(`❌ Checkout: Error calculando delivery para creador ${creatorId}:`, error);
              console.error(`❌ Checkout: Detalles del error:`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
              throw error;
            }

            if (!data || data.length === 0) {
              console.error(`❌ Checkout: No se recibieron datos para creador ${creatorId}`);
              throw new Error(`No se pudo calcular delivery para creador ${creatorId}`);
            }

            const deliveryInfo = data[0];
            deliveryResults.push({ 
              creatorId, 
              creator_name: creatorNames[creatorId] || 'Creador',
              creator_zone: creatorZones[creatorId] || '',
              vehicle_used: vehicleForCreator,
              ...deliveryInfo 
            });
            
            console.log(`📊 Checkout: Resultado delivery creador ${creatorId}:`, {
              delivery_fee: deliveryInfo.delivery_fee,
              distance_km: deliveryInfo.distance_km,
              distance_km_nota: 'Esta distancia ya incluye factor 1.4 (ruta real vs línea recta)',
              creator_location: deliveryInfo.creator_location,
              is_within_radius: deliveryInfo.is_within_radius,
              vehicle_used: deliveryInfo.vehicle_used
            });
            console.log(`🧮 Checkout: CÁLCULO DELIVERY creador ${creatorId}:`, {
              distancia_corregida_km: deliveryInfo.distance_km,
              vehiculo: deliveryInfo.vehicle_used,
              tarifa_final: `Q${deliveryInfo.delivery_fee}`,
              formula: 'base + ((distancia - 3km gratis) × precio_por_km)'
            });
            
            // Verificar si el creador tiene ubicación configurada
            if (deliveryInfo.creator_location === 'Ubicación no configurada' || deliveryInfo.creator_location === 'NO_LOCATION') {
              console.log(`🚫 Checkout: Creador ${creatorId} NO TIENE UBICACIÓN CONFIGURADA - BLOQUEANDO PEDIDO`);
              setDeliveryFee(0);
              setDeliveryError(
                `⚠️ ${creatorNames[creatorId] || 'Un creador'} no tiene ubicación configurada. No podemos calcular el costo de entrega. Contacta al creador o a servicio al cliente.`
              );
              setIsCalculatingDelivery(false);
              return;
            } else if (!deliveryInfo.is_within_radius) {
              console.log(`🚫 Checkout: Creador ${creatorId} FUERA DE RANGO`);
              console.log(`📏 Checkout: Distancia: ${deliveryInfo.distance_km}km`);
              console.log(`📍 Checkout: Ubicación creador: ${deliveryInfo.creator_location}`);
              console.log(`🎯 Checkout: Radio máximo: 20km`);
              allCreatorsWithinRange = false;
            } else {
              console.log(`✅ Checkout: Creador ${creatorId} DENTRO DEL RANGO`);
              console.log(`💰 Checkout: Fee: Q${deliveryInfo.delivery_fee}`);
              console.log(`📏 Checkout: Distancia: ${deliveryInfo.distance_km}km`);
              totalDeliveryFee += parseFloat(deliveryInfo.delivery_fee);
            }
          }
          
          if (!allCreatorsWithinRange) {
            console.log('🚫 Checkout: ENTREGA NO DISPONIBLE - Uno o más creadores están fuera de rango');
            console.log('📊 Checkout: DETALLES COMPLETOS DE ENTREGA:', {
              totalCreators: creatorIds.length,
              allCreatorsWithinRange,
              totalDeliveryFee,
              deliveryResults: deliveryResults.map(r => ({
                creatorId: r.creatorId,
                distance_km: r.distance_km,
                delivery_fee: r.delivery_fee,
                is_within_radius: r.is_within_radius,
                creator_location: r.creator_location
              }))
            });
            console.log('🎯 Checkout: CREADORES FUERA DE RANGO:', 
              deliveryResults.filter(r => !r.is_within_radius).map(r => ({
                creatorId: r.creatorId,
                distance: r.distance_km + 'km',
                maxRadius: '20km',
                location: r.creator_location
              }))
            );
            setDeliveryFee(0);
            setDeliveryError(
              t?.toastDeliveryUnavailable ??
                `❌ Entrega no disponible en tu ubicación. Contacta a servicio al cliente: +502 30635323 (WhatsApp: ${WHATSAPP_SUPPORT_URL}).`
            );
          } else {
            console.log(`✅ Checkout: ENTREGA DISPONIBLE - Total: Q${totalDeliveryFee}`);
            console.log('📊 Checkout: DETALLES ENTREGA EXITOSA:', {
              totalCreators: creatorIds.length,
              totalDeliveryFee,
              deliveryResults: deliveryResults.map(r => ({
                creatorId: r.creatorId,
                distance_km: r.distance_km,
                delivery_fee: r.delivery_fee,
                creator_location: r.creator_location
              }))
            });
            setDeliveryFee(totalDeliveryFee);
            setDeliveryError(null);
            
            // Guardar desglose de delivery
            const breakdown = deliveryResults.map(r => ({
              creator_id: r.creatorId,
              creator_name: r.creator_name || 'Creador',
              creator_zone: r.creator_zone || '',
              delivery_fee: parseFloat(r.delivery_fee),
              distance_km: parseFloat(r.distance_km),
              vehicle: r.vehicle_used || 'moto'
            }));
            console.log('📊 Checkout: BREAKDOWN FINAL:', breakdown);
            console.log('💰 Checkout: RESUMEN TARIFAS:', breakdown.map(b => 
              `${b.creator_name} (${b.creator_zone}): ${b.vehicle === 'auto' ? '🚗 AUTO' : '🏍️ MOTO'} = Q${b.delivery_fee} (${b.distance_km}km)`
            ));
            setDeliveryBreakdown(breakdown);
            
            // Verificar si algún creador está a más de 50km (distancia larga)
            const LONG_DISTANCE_THRESHOLD = 50;
            const longDistanceCreators = breakdown.filter(b => b.distance_km > LONG_DISTANCE_THRESHOLD);
            if (longDistanceCreators.length > 0) {
              const maxDistanceCreator = longDistanceCreators.reduce((a, b) => a.distance_km > b.distance_km ? a : b);
              console.log(`⚠️ Checkout: ADVERTENCIA DISTANCIA LARGA - ${maxDistanceCreator.creator_name} a ${maxDistanceCreator.distance_km}km`);
              setLongDistanceWarning({
                show: true,
                maxDistance: Math.round(maxDistanceCreator.distance_km),
                creatorName: maxDistanceCreator.creator_name
              });
            } else {
              setLongDistanceWarning({ show: false });
            }
          }
          
          setIsCalculatingDelivery(false);
        } catch (error) {
          console.error('❌ Checkout: Error calculando delivery:', error);
          console.error('🔍 Checkout: Detalles del error:', {
            message: (error as Error).message,
            stack: (error as Error).stack,
            finalLocation,
            creatorIds: [...new Set(items.map(item => item.product.creatorId))],
            deliveryData: {
              department: deliveryData.department,
              municipality: deliveryData.municipality
            }
          });
          setDeliveryFee(0);
          setDeliveryError(t?.toastDeliveryErrorDesc ?? 'Error calculando costo de entrega. Intenta de nuevo.');
          setIsCalculatingDelivery(false);
        }
      }, 1500);
    } else {
      console.log('⏸️ Checkout: Condiciones NO cumplidas para cálculo delivery:', {
        finalLocation: !!finalLocation,
        manualLocation: !!manualLocation,
        department: !!deliveryData.department,
        municipality: !!deliveryData.municipality
      });
    }
  }, [finalLocation, manualLocation, deliveryData.department, deliveryData.municipality]);

  // Agrupar productos por creador
  const itemsByCreator = items.reduce((acc, item) => {
    const creatorId = item.product.creatorId;
    if (!acc[creatorId]) {
      acc[creatorId] = [];
    }
    acc[creatorId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handlePlaceOrder = async () => {
    if (!authUser) {
      toast({
        variant: "destructive",
        title: t?.toastLoginTitle ?? "Error",
        description: t?.toastLoginDesc ?? "Debes iniciar sesión para realizar un pedido.",
      });
      router.push('/login');
      return;
    }

    // Validar campos requeridos
    if (!deliveryData.name || !deliveryData.phone || !deliveryData.street || !deliveryData.department || !deliveryData.municipality) {
      toast({
        variant: "destructive",
        title: t?.toastIncompleteTitle ?? "Campos incompletos",
        description: t?.toastIncompleteDesc ?? "Por favor completa todos los campos de entrega.",
      });
      return;
    }

    // Validar geolocalización (requerida para cálculo exacto de delivery)
    if (!finalLocation) {
      toast({
        variant: "destructive",
        title: t?.toastLocationRequiredTitle ?? "Ubicación requerida",
        description: t?.toastLocationRequiredDesc ?? "Por favor selecciona tu ubicación para calcular el costo exacto de delivery.",
      });
      return;
    }

    // Validar fecha de entrega (mínimo 48h) y auto-clampar si es menor
    const selectedDeliveryDateRaw = deliveryDateInput ? new Date(deliveryDateInput) : estimatedDeliveryDate;
    const selectedDeliveryDate = isNaN(selectedDeliveryDateRaw.getTime()) ? estimatedDeliveryDate : selectedDeliveryDateRaw;
    const minDate = addHours(new Date(), minimumDeliveryTime);
    const finalDeliveryDate = selectedDeliveryDate.getTime() < minDate.getTime() ? minDate : selectedDeliveryDate;
    if (finalDeliveryDate !== selectedDeliveryDate) {
      // Ajustar el input para reflejar el mínimo y evitar el warning
      setDeliveryDateInput(formatForInput(finalDeliveryDate));
      if (typeof window !== 'undefined') {
        localStorage.setItem(DELIVERY_DATETIME_KEY, formatForInput(finalDeliveryDate));
      }
    }

    try {
      // Revalidar si es necesario
      const validationResult = await runAddressValidation();
      if (validationResult.ok === false) {
        return;
      }

      // Ya no bloqueamos por validación de dirección - servicio al cliente verificará

      setIsProcessing(true);
      const result = await createOrder({
        userId: authUser.id,
        customerName: deliveryData.name,
        customerPhone: deliveryData.phone,
        fallbackPhone: user?.phone || (authUser.user_metadata as any)?.phone || '',
        customerEmail: deliveryData.email,
        items: items,
        total: total,
        deliveryDate: selectedDeliveryDate,
        deliveryAddress: {
          street: deliveryData.street,
          department: deliveryData.department,
          municipality: deliveryData.municipality,
          notes: deliveryData.notes
        },
        paymentMethod: paymentMethod,
        // Opciones de privacidad
        userLocation: finalLocation,
        saveLocationData: saveLocationData,
        autoDeleteAfterDelivery: autoDeleteAfterDelivery,
        // Desglose de delivery
        deliveryBreakdown: deliveryBreakdown
      });

      if (result.order) {
        // ✅ LIMPIAR CARRITO COMPLETAMENTE
        dispatch({ type: 'CLEAR_CART' });
        
        // ✅ LIMPIAR TAMBIÉN STORAGE MANUALMENTE
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tasty-cart');
          sessionStorage.removeItem('tasty-cart-backup');
          console.log('🧹 Checkout: Carrito limpiado completamente (React + localStorage + sessionStorage)');
        }
        
        // ✅ LIMPIAR CARRITO EN BD TAMBIÉN (tabla correcta: user_carts)
        try {
          await supabase
            .from('user_carts')
            .delete()
            .eq('user_id', authUser.id);
          console.log('🗄️ Checkout: Carrito limpiado en BD (user_carts)');
        } catch (error) {
          console.error('❌ Error limpiando carrito en BD:', error);
        }
        
        // ✅ MARCAR QUE EL CARRITO FUE LIMPIADO INTENCIONALMENTE
        sessionStorage.setItem('tasty-cart-cleared', 'true');
        
        toast({
          title: t?.toastOrderSuccessTitle ?? "¡Pedido realizado!",
          description: t?.toastOrderSuccessDesc
            ? t.toastOrderSuccessDesc(result.order.id.slice(0, 8))
            : `Tu pedido #${result.order.id.slice(0, 8)} ha sido creado. Ve a "Mis Pedidos" para enviar el WhatsApp de coordinación.`,
        });
        
        router.push('/user/orders');
      } else {
        throw new Error('Error al crear la orden');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: "destructive",
        title: t?.toastOrderErrorTitle ?? "Error",
        description: t?.toastOrderErrorDesc ?? "No se pudo procesar tu pedido. Intenta de nuevo.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Modal de selección de ubicación
  if (showLocationSelector) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <LocationSelector
          onLocationSelected={(location) => {
            console.log('📍 Checkout: Ubicación seleccionada desde LocationSelector:', location);
            setManualLocation(location);
            setShowLocationSelector(false);
          }}
          onCancel={() => {
            console.log('❌ Checkout: LocationSelector cancelado');
            setShowLocationSelector(false);
          }}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 font-headline text-2xl">
            {t?.emptyTitle ?? "Tu carrito está vacío"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t?.emptyDescription ?? "Agrega algunos productos antes de hacer tu pedido"}
          </p>
          <Button asChild className="mt-6">
            <a href="/">{t?.emptyCta ?? "Explorar Productos"}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {t?.pageTitle ?? "Hacer tu Pedido"}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t?.deliveryInfoTitle ?? "Información de Entrega"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t?.nameLabel ?? "Nombre completo *"}</Label>
                  <Input
                    id="name"
                    value={deliveryData.name}
                    onChange={(e) => updateDeliveryField('name', e.target.value)}
                    placeholder={t?.namePlaceholder ?? "Tu nombre completo"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t?.phoneLabel ?? "Teléfono *"}</Label>
                  <Input
                    id="phone"
                    value={deliveryData.phone}
                    onChange={(e) => updateDeliveryField('phone', e.target.value)}
                    placeholder={t?.phonePlaceholder ?? "+502 1234-5678"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t?.emailLabel ?? "Correo electrónico"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={deliveryData.email}
                    onChange={(e) => updateDeliveryField('email', e.target.value)}
                    placeholder={t?.emailPlaceholder ?? "tu@email.com"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">{t?.departmentLabel ?? "Departamento *"}</Label>
                  <Select value={deliveryData.department} onValueChange={handleDepartmentChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t?.departmentPlaceholder ?? "Selecciona un departamento"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Guatemala">Guatemala</SelectItem>
                      <SelectItem value="Sacatepéquez">Sacatepéquez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">{t?.municipalityLabel ?? "Municipio *"}</Label>
                  <Select 
                    value={deliveryData.municipality} 
                    onValueChange={(value) => updateDeliveryField('municipality', value)}
                    disabled={!deliveryData.department}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          deliveryData.department
                            ? t?.municipalityLabel ?? "Selecciona un municipio"
                            : t?.municipalityPlaceholder ?? "Primero selecciona un departamento"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMunicipalities.map((municipality) => (
                        <SelectItem key={municipality} value={municipality}>
                          {municipality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">{t?.streetLabel ?? "Dirección completa *"}</Label>
                  <Input
                    id="street"
                    value={deliveryData.street}
                    onChange={(e) => updateDeliveryField('street', e.target.value)}
                    placeholder={t?.streetPlaceholder ?? "Calle, número de casa, zona, referencias"}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">{t?.notesLabel ?? "Notas adicionales (opcional)"}</Label>
                  <Textarea
                    id="notes"
                    value={deliveryData.notes}
                    onChange={(e) => updateDeliveryField('notes', e.target.value)}
                    placeholder={t?.notesPlaceholder ?? "Instrucciones especiales para la entrega..."}
                    rows={3}
                  />
                </div>
                
                {/* Botón Guardar Dirección */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={async () => {
                      console.log('✅ Checkout: Dirección confirmada por usuario:', deliveryData);
                      toast({
                        title: t?.saveAddressToastTitle ?? "✅ Dirección guardada exitosamente",
                        description: t?.saveAddressToastDesc
                          ? t.saveAddressToastDesc(deliveryData.street, deliveryData.municipality, deliveryData.department)
                          : `${deliveryData.street}, ${deliveryData.municipality}, ${deliveryData.department}`,
                      });
                      await runAddressValidation();
                    }}
                    disabled={!deliveryData.name || !deliveryData.phone || !deliveryData.department || !deliveryData.municipality || !deliveryData.street}
                  >
                    {t?.saveAddressButton ?? "Guardar Cambios"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">{dict.cartView?.deliveryDateLabel ?? 'Fecha y hora deseada (mín. 48h)'}</Label>
                  <UITextInput
                    id="deliveryDate"
                    type="datetime-local"
                    min={minimumDeliveryInput}
                    value={deliveryDateInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeliveryDateInput(val);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(DELIVERY_DATETIME_KEY, val);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {dict.cartView?.deliveryDateHelper ?? 'Si no eliges, usaremos el mínimo de 48h automáticamente.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geolocalización requerida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t?.locationCardTitle ?? "Ubicación para Entrega (Requerida)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!finalLocation ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">
                          {t?.locationRequiredTitle ?? "Ubicación requerida"}
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                          {t?.locationRequiredDesc ??
                            "Necesitamos tu ubicación exacta para calcular el costo de delivery y coordinar la entrega."}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => {
                        console.log('📍 Checkout: Botón "Usar mi ubicación actual" presionado');
                        console.log('📍 Checkout: Estado actual de geolocalización:', { userLocation, locationError, isGettingLocation });
                        getLocation();
                      }}
                      disabled={isGettingLocation}
                      className="w-full"
                      size="lg"
                      variant="default"
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t?.useCurrentLocationLoading ?? "Obteniendo ubicación..."}
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          {t?.buttonUseCurrent ?? "📍 Usar mi ubicación actual"}
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        console.log('🗺️ Checkout: Botón "Seleccionar en mapa" presionado');
                        console.log('🗺️ Checkout: Abriendo LocationSelector...');
                        setShowLocationSelector(true);
                      }}
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {t?.buttonSelectOnMap ?? "📌 Seleccionar en mapa"}
                    </Button>
                  </div>
                  
                  {locationError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                      {t?.locationErrorPrefix ?? "❌"} {locationError}
                      <p className="mt-2 text-xs">
                        {t?.locationErrorHint ??
                          '💡 Puedes usar la opción "Seleccionar en mapa" si no puedes compartir tu ubicación.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-800">
                          {userLocation
                            ? t?.gpsConfirmed ?? '📍 Ubicación GPS confirmada'
                            : t?.manualSelected ?? '📌 Ubicación manual seleccionada'}
                        </h4>
                        <p className="text-sm text-green-700">
                          Lat: {finalLocation.lat.toFixed(6)}, Lng: {finalLocation.lng.toFixed(6)}
                        </p>
                        {manualLocation && (
                          <p className="text-xs text-green-600 mt-1">
                            {t?.approxHint ?? '💡 Ubicación aproximada - Centro de Guatemala City'}
                          </p>
                        )}
                        <div className="mt-3">
                          <Button
                            variant="secondary"
                            className="bg-accent text-accent-foreground hover:bg-accent/80"
                            size="sm"
                            onClick={() => setShowLocationSelector(true)}
                          >
                            {t?.changeLocation ?? "Cambiar ubicación"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opciones de privacidad */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">
                      {t?.privacyTitle ?? "🔒 Opciones de Privacidad"}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="save-location"
                          checked={saveLocationData}
                          onCheckedChange={(checked) => setSaveLocationData(checked as boolean)}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="save-location" className="text-sm font-medium text-blue-800">
                            {t?.saveLocationLabel ?? "Guardar mi dirección y ubicación para futuros pedidos"}
                          </Label>
                          <p className="text-xs text-blue-600">
                            {t?.saveLocationDesc ?? "Te permitirá hacer pedidos más rápido sin volver a ingresar tu dirección"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="auto-delete"
                          checked={autoDeleteAfterDelivery}
                          onCheckedChange={(checked) => setAutoDeleteAfterDelivery(checked as boolean)}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="auto-delete" className="text-sm font-medium text-blue-800">
                            {t?.autoDeleteLabel ?? "Eliminar automáticamente mis datos de ubicación después de la entrega"}
                          </Label>
                          <p className="text-xs text-blue-600">
                            {t?.autoDeleteDesc ?? "Máxima privacidad: tus datos se borran una vez completado el pedido"}
                          </p>
                        </div>
                      </div>

                      {saveLocationData && autoDeleteAfterDelivery && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2">
                          <p className="text-xs text-amber-700">
                            {t?.privacyCombinedNote ??
                              "⚠️ Nota: Si eliges ambas opciones, se guardará temporalmente y se eliminará después de la entrega"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mapa de delivery (solo si hay ubicación) */}
          {userLocation && (
            <DeliveryMap
              selectedDepartment={deliveryData.department}
              selectedMunicipality={deliveryData.municipality}
              userLocation={userLocation}
              onDeliveryFeeCalculated={handleDeliveryFeeCalculated}
            />
          )}

          {/* Método de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t?.paymentTitle ?? "Método de Pago"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t?.cashOption ?? "Efectivo (Pago contra entrega)"}</SelectItem>
                  <SelectItem value="transfer">{t?.transferOption ?? "Transferencia bancaria"}</SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod === 'cash' && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t?.cashDesc ?? "Pagarás en efectivo cuando recibas tu pedido."}
                </p>
              )}
              {paymentMethod === 'transfer' && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t?.transferDesc ?? "Te enviaremos los datos bancarios después de confirmar tu pedido."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Resumen del pedido */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t?.summaryTitle ?? "Resumen del Pedido"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Productos agrupados por creador */}
              <div className="space-y-4">
                {Object.entries(itemsByCreator).map(([creatorId, creatorItems]) => (
                  <div key={creatorId} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground border-b pb-1">
                      {t?.productsFrom ?? "Productos de"} {creatorInfoMap[creatorId]?.name || t?.creatorGroupTitle || "Creador"}
                      {creatorInfoMap[creatorId]?.zone && (
                        <span className="text-xs text-gray-400 ml-1">· {creatorInfoMap[creatorId].zone}</span>
                      )}
                    </div>
                    {creatorItems.map(({ product, quantity }) => {
                      const productName = product.name[language];
                      return (
                        <div key={product.id} className="flex items-center gap-3">
                          <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={product.imageUrl}
                              alt={productName}
                              fill
                              style={{ objectFit: 'cover', objectPosition: 'center' }}
                            />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium">{productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {quantity} × {formatPrice(product.price)}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                            <span>
                              {(t?.preparationLabel ?? "Preparación") + ": "}{product.preparationTime}h
                            </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium">
                            {formatPrice(product.price * quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totales */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t?.productsLabel ?? "Productos"}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t?.ivaLabel ?? "I.V.A. (12%)"}</span>
                  <span>{formatPrice(ivaAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>{t?.subtotalLabel ?? "Subtotal"}</span>
                  <span>{formatPrice(subtotalWithIva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>{t?.deliveryCostLabel ?? "Costo de entrega"}</span>
                  <span>
                    {isCalculatingDelivery ? (
                      <span className="text-amber-600">{t?.deliveryCalculating ?? "Calculando..."}</span>
                    ) : deliveryFee !== null ? (
                      <span>
                        {formatPrice(deliveryFee)}{" "}
                        <span className="text-xs text-muted-foreground">
                          {t?.deliveryEstimatedTag ?? "(estimado)"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {t?.deliveryPlaceholder ?? "Q 25.00 + ajuste por distancia"}
                      </span>
                    )}
                  </span>
                </div>
                {/* Explicación de delivery múltiple */}
                {Object.keys(itemsByCreator).length > 1 && (
                  <div className="text-xs text-muted-foreground mt-2 p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium text-amber-800 mb-1">
                          {t?.deliveryMultipleTitle
                            ? t.deliveryMultipleTitle(Object.keys(itemsByCreator).length)
                            : `🚚 Delivery múltiple - ${Object.keys(itemsByCreator).length} creadores`}
                        </p>
                        <p className="text-amber-700">
                          {t?.deliveryMultipleDesc ??
                            'Tus productos vienen de varias ubicaciones y requieren entregas separadas. Cada creador tiene su propia tarifa según distancia.'}
                        </p>
                        <div className="space-y-1 text-amber-800">
                          {(deliveryBreakdown?.length ? deliveryBreakdown : []).map((d, idx) => (
                            <div key={`${d.creator_id || idx}`} className="flex justify-between">
                              <span>
                                {d.vehicle === 'auto' ? '🚗' : '🏍️'} {d.creator_name || `Creador ${idx + 1}`}
                                {d.creator_zone && <span className="text-amber-600 text-xs ml-1">({d.creator_zone})</span>}
                                {Number.isFinite(d.distance_km) && ` · ${Number(d.distance_km).toFixed(1)} km`}
                              </span>
                              <span>Q {Number(d.delivery_fee || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        {(!deliveryBreakdown || deliveryBreakdown.length === 0) && (
                          <p className="text-amber-700 text-xs">
                            {t?.deliveryMultipleFallback ??
                              "El costo final se mostrará por creador según la distancia calculada."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Warning delivery alto > Q100 */}
                {Array.isArray(deliveryBreakdown) && deliveryBreakdown.some(d => Number(d.delivery_fee) > 100) && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    {(() => {
                      const first = deliveryBreakdown.find(d => Number(d.delivery_fee) > 100);
                      const km = Number(first?.distance_km);
                      return t?.highDeliveryWarning
                        ? t.highDeliveryWarning(Number.isFinite(km) ? km : undefined)
                        : `⚠️ Delivery alto (>Q100) por distancia${Number.isFinite(km) ? ` (~${km.toFixed(1)} km)` : ''}. Deberás confirmar con servicio al cliente la disponibilidad y horario de entrega.`;
                    })()}
                  </div>
                )}
                
                <div className="text-xs text-amber-700 mt-2 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="font-medium mb-1">⚠️ {t?.deliveryCostNoticeTitle ?? "Aviso sobre costo de delivery"}</p>
                  <p>
                    {t?.deliveryCostNoticeBody ??
                      "El costo de delivery mostrado es un estimado basado en la ubicación que seleccionaste. El monto final será confirmado por nuestro equipo de servicio al cliente, quienes verificarán tu dirección y ubicación de entrega. Si hay diferencia, te contactaremos por WhatsApp antes de procesar tu pedido."}
                  </p>
                </div>
                
                {/* Warning de distancia larga (>50km) */}
                {longDistanceWarning.show && (
                  <div className="mt-2 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                    <p className="font-bold text-red-800 mb-2">
                      🚨 {t?.longDistanceWarningTitle ?? "Distancia de entrega muy larga"}
                    </p>
                    <p className="text-sm text-red-700 mb-3">
                      {t?.longDistanceWarningBody 
                        ? t.longDistanceWarningBody(longDistanceWarning.maxDistance || 0, longDistanceWarning.creatorName || '')
                        : `La distancia a ${longDistanceWarning.creatorName} es de aproximadamente ${longDistanceWarning.maxDistance}km. Para entregas fuera del área metropolitana, te recomendamos coordinar directamente con nuestro servicio al cliente para confirmar disponibilidad y costo final de envío.`}
                    </p>
                    <a
                      href={`https://wa.me/50230635323?text=${encodeURIComponent(
                        `Hola! 👋 Quiero hacer un pedido pero la distancia es de ${longDistanceWarning.maxDistance}km (a ${longDistanceWarning.creatorName}). ¿Es posible coordinar la entrega? Mi ubicación es: ${deliveryData.municipality}, ${deliveryData.department}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {t?.longDistanceWhatsAppButton ?? "Contactar por WhatsApp"}
                    </a>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>{t?.totalLabel ?? "Total"}</span>
                  <span>
                    {deliveryFee !== null ? (
                      formatPrice(total)
                    ) : (
                      <span className="text-muted-foreground">Pendiente</span>
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Tiempo de entrega */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  {t?.estimatedDeliveryTitle ?? "Entrega estimada"}
                </div>
                <p className="text-sm text-muted-foreground">{formatSelectedDateDisplay()}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-700">
                    {t?.policy48h ??
                      "⏰ Política de entrega: Mínimo 48 horas de anticipación para garantizar la frescura de tus productos."}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-700">
                    {t?.policyWhatsApp ??
                      "📞 Nota importante: Al finalizar tu pedido te daremos el número de WhatsApp de servicio al cliente para que coordines tu día y hora de entrega específica."}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Políticas importantes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t?.policiesTitle ?? "Políticas Importantes"}
                </h4>
                <div className="space-y-1 text-xs text-amber-700">
                  <p>{t?.policyMinDelivery ?? "• Entrega mínima: 48 horas de anticipación"}</p>
                  <p>{t?.policyCancelation ?? "• Cancelación: Hasta 24 horas antes que inicie tu período de 48h de preparación y entrega"}</p>
                  <p>{t?.policyFresh ?? "• Productos frescos: Preparados especialmente para ti"}</p>
                </div>
                <p className="mt-3 text-xs text-amber-800 italic">
                  {t?.handmadeNotice ?? "🤲 Debido a que todos nuestros productos son hechos a mano y con amor, los tiempos de entrega pueden variar y deben ser acordados con el creador, basado en su disponibilidad y demanda. Nuestro departamento de servicio al cliente te ayudará con eso."}
                </p>
              </div>
            </CardContent>
            <CardFooter>
            <Button
              onClick={() => {
                console.log('🛒 Checkout: INTENTANDO HACER PEDIDO - Estado actual:', {
                  isProcessing,
                  finalLocation: !!finalLocation,
                  finalLocationData: finalLocation,
                  deliveryFee,
                  deliveryError,
                  manualLocation: !!manualLocation,
                  manualLocationData: manualLocation
                });
                if (!finalLocation) {
                  console.log('❌ Checkout: PEDIDO BLOQUEADO - No hay finalLocation');
                  toast({
                    title: t?.toastLocationRequiredTitle ?? "❌ Ubicación requerida",
                    description: t?.toastLocationRequiredDesc ?? "Selecciona tu ubicación en el mapa para continuar",
                    variant: "destructive"
                  });
                  return;
                }
                handlePlaceOrder();
              }}
              disabled={isProcessing || !finalLocation || deliveryFee === null || deliveryError !== null || addressValidation.state === 'blocked'}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t?.ctaProcessing ?? "Procesando pedido..."}
                </>
              ) : !finalLocation ? (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  {t?.ctaLocationRequired ?? "Ubicación requerida para continuar"}
                </>
              ) : deliveryFee === null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t?.ctaCalculatingDelivery ?? "Calculando delivery..."}
                </>
              ) : deliveryError ? (
                <>
                  {t?.ctaUnavailable ?? "🚫 Entrega no disponible"}
                </>
              ) : (
                (t?.ctaConfirm ? t.ctaConfirm(formatPrice(total)) : `Confirmar Pedido - ${formatPrice(total)}`)
              )}
            </Button>
            
            {!finalLocation && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {t?.hintSelectLocation ?? "💡 Selecciona tu ubicación arriba para habilitar el botón de pedido"}
              </p>
            )}
            
            {deliveryError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-red-700 font-medium">
                  {deliveryError}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {t?.hintDeliveryUnavailable ??
                    "💡 Intenta con una ubicación más cercana a la capital o contacta a los creadores directamente."}
                </p>
              </div>
            )}
            {finalLocation && deliveryFee === null && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {t?.hintCalculating ?? "⏳ Calculando costo de delivery según tu ubicación..."}
              </p>
            )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
