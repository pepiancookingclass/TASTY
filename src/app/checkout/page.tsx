'use client';

import { useState } from 'react';
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
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/lib/services/orders';
import { useRouter } from 'next/navigation';
import { DeliveryMap } from '@/components/ui/delivery-map';
import { useGeolocation } from '@/hooks/useGeolocation';

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

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Estados para opciones de privacidad
  const [saveLocationData, setSaveLocationData] = useState(false);
  const [autoDeleteAfterDelivery, setAutoDeleteAfterDelivery] = useState(true);
  
  // Datos de entrega
  const [deliveryData, setDeliveryData] = useState({
    name: user?.displayName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    street: user?.address_street || '',
    department: user?.address_state || '',
    municipality: user?.address_city || '',
    notes: ''
  });

  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>(
    deliveryData.department ? GUATEMALA_DEPARTMENTS[deliveryData.department as keyof typeof GUATEMALA_DEPARTMENTS] || [] : []
  );

  // Estados para delivery dinámico
  const [deliveryFee, setDeliveryFee] = useState(15.0);
  const { location: userLocation, error: locationError, loading: isGettingLocation, getLocation } = useGeolocation();

  // Cálculos
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const platformFee = subtotal * 0.1;
  const total = subtotal + platformFee + deliveryFee;

  const maxPreparationTime = Math.max(...items.map(item => item.product.preparationTime), 0);
  
  // Política de 48 horas: la entrega debe ser mínimo 48 horas después del pedido
  const minimumDeliveryTime = 48; // horas
  const earliestDeliveryDate = addHours(new Date(), minimumDeliveryTime);
  const estimatedDeliveryDate = addHours(earliestDeliveryDate, maxPreparationTime);
  const formattedDeliveryDate = format(estimatedDeliveryDate, "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(price);
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
  };

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
        title: "Error",
        description: "Debes iniciar sesión para realizar un pedido.",
      });
      router.push('/login');
      return;
    }

    // Validar campos requeridos
    if (!deliveryData.name || !deliveryData.phone || !deliveryData.street || !deliveryData.department || !deliveryData.municipality) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor completa todos los campos de entrega.",
      });
      return;
    }

    // Validar geolocalización (requerida para cálculo exacto de delivery)
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Ubicación requerida",
        description: "Por favor permite el acceso a tu ubicación para calcular el costo exacto de delivery.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await createOrder({
        userId: authUser.id,
        customerName: deliveryData.name,
        customerPhone: deliveryData.phone,
        customerEmail: deliveryData.email,
        items: items,
        total: total,
        deliveryDate: estimatedDeliveryDate,
        deliveryAddress: {
          street: deliveryData.street,
          department: deliveryData.department,
          municipality: deliveryData.municipality,
          notes: deliveryData.notes
        },
        paymentMethod: paymentMethod,
        // Opciones de privacidad
        userLocation: userLocation,
        saveLocationData: saveLocationData,
        autoDeleteAfterDelivery: autoDeleteAfterDelivery
      });

      if (result.order) {
        // Limpiar carrito
        dispatch({ type: 'CLEAR_CART' });
        
        // Mostrar mensaje de confirmación con WhatsApp
        const confirmMessage = `¡Pedido #${result.order.id.slice(0, 8)} creado exitosamente!\n\n${result.customerMessage}\n\n¿Enviar confirmación a nuestro agente?`;
        
        if (confirm(confirmMessage)) {
          // Abrir WhatsApp al agente
          window.open(result.whatsappUrl, '_blank');
        }
        
        toast({
          title: "¡Pedido realizado!",
          description: `Tu pedido #${result.order.id.slice(0, 8)} ha sido creado exitosamente.`,
        });
        
        router.push('/user/profile');
      } else {
        throw new Error('Error al crear la orden');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar tu pedido. Intenta de nuevo.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 font-headline text-2xl">Tu carrito está vacío</h2>
          <p className="mt-2 text-muted-foreground">Agrega algunos productos antes de hacer tu pedido</p>
          <Button asChild className="mt-6">
            <a href="/">Explorar Productos</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Hacer tu Pedido</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={deliveryData.name}
                    onChange={(e) => updateDeliveryField('name', e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={deliveryData.phone}
                    onChange={(e) => updateDeliveryField('phone', e.target.value)}
                    placeholder="+502 1234-5678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={deliveryData.email}
                    onChange={(e) => updateDeliveryField('email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Select value={deliveryData.department} onValueChange={handleDepartmentChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Guatemala">Guatemala</SelectItem>
                      <SelectItem value="Sacatepéquez">Sacatepéquez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipio *</Label>
                  <Select 
                    value={deliveryData.municipality} 
                    onValueChange={(value) => updateDeliveryField('municipality', value)}
                    disabled={!deliveryData.department}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={deliveryData.department ? "Selecciona un municipio" : "Primero selecciona un departamento"} />
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
                  <Label htmlFor="street">Dirección completa *</Label>
                  <Input
                    id="street"
                    value={deliveryData.street}
                    onChange={(e) => updateDeliveryField('street', e.target.value)}
                    placeholder="Calle, número de casa, zona, referencias"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={deliveryData.notes}
                    onChange={(e) => updateDeliveryField('notes', e.target.value)}
                    placeholder="Instrucciones especiales para la entrega..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geolocalización requerida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación para Entrega (Requerida)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!userLocation ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Ubicación requerida</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Necesitamos tu ubicación exacta para calcular el costo de delivery y coordinar la entrega.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    className="w-full"
                    size="lg"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Obteniendo ubicación...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Permitir acceso a mi ubicación
                      </>
                    )}
                  </Button>
                  
                  {locationError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                      ❌ {locationError}
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
                        <h4 className="font-medium text-green-800">✅ Ubicación confirmada</h4>
                        <p className="text-sm text-green-700">
                          Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones de privacidad */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">🔒 Opciones de Privacidad</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="save-location"
                          checked={saveLocationData}
                          onCheckedChange={(checked) => setSaveLocationData(checked as boolean)}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="save-location" className="text-sm font-medium text-blue-800">
                            Guardar mi dirección y ubicación para futuros pedidos
                          </Label>
                          <p className="text-xs text-blue-600">
                            Te permitirá hacer pedidos más rápido sin volver a ingresar tu dirección
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
                            Eliminar automáticamente mis datos de ubicación después de la entrega
                          </Label>
                          <p className="text-xs text-blue-600">
                            Máxima privacidad: tus datos se borran una vez completado el pedido
                          </p>
                        </div>
                      </div>

                      {saveLocationData && autoDeleteAfterDelivery && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2">
                          <p className="text-xs text-amber-700">
                            ⚠️ Nota: Si eliges ambas opciones, se guardará temporalmente y se eliminará después de la entrega
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
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo (Pago contra entrega)</SelectItem>
                  <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod === 'cash' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Pagarás en efectivo cuando recibas tu pedido.
                </p>
              )}
              {paymentMethod === 'transfer' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Te enviaremos los datos bancarios después de confirmar tu pedido.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Resumen del pedido */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Productos agrupados por creador */}
              <div className="space-y-4">
                {Object.entries(itemsByCreator).map(([creatorId, creatorItems]) => (
                  <div key={creatorId} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground border-b pb-1">
                      Productos del mismo creador
                    </div>
                    {creatorItems.map(({ product, quantity }) => {
                      const productName = product.name[language];
                      return (
                        <div key={product.id} className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded overflow-hidden">
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
                              <span>{product.preparationTime}h</span>
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
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Comisión de plataforma (10%)</span>
                  <span>{formatPrice(platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Costo de entrega</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Separator />

              {/* Tiempo de entrega */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Entrega estimada
                </div>
                <p className="text-sm text-muted-foreground">{formattedDeliveryDate}</p>
                <p className="text-xs text-muted-foreground">
                  Tiempo de preparación: {maxPreparationTime} horas (mínimo 48h de anticipación)
                </p>
              </div>

              <Separator />

              {/* Políticas importantes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Políticas Importantes
                </h4>
                <div className="space-y-1 text-xs text-amber-700">
                  <p>• <strong>Entrega mínima:</strong> 48 horas de anticipación</p>
                  <p>• <strong>Cancelación:</strong> Hasta 48 horas antes de la entrega</p>
                  <p>• <strong>Productos frescos:</strong> Preparados especialmente para ti</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
            <Button 
              onClick={handlePlaceOrder}
              disabled={isProcessing || !userLocation}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando pedido...
                </>
              ) : !userLocation ? (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Ubicación requerida para continuar
                </>
              ) : (
                `Confirmar Pedido - ${formatPrice(total)}`
              )}
            </Button>
            
            {!userLocation && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                💡 Permite el acceso a tu ubicación arriba para habilitar el botón de pedido
              </p>
            )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
