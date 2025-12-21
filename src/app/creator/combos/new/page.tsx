'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Plus, 
  Trash2, 
  Search,
  Users, 
  ShoppingBag, 
  Gift, 
  Calculator,
  Clock,
  Percent,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/useUser';
import { Product, User } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

const categoryLabels = {
  'sweet_savory': 'Dulce & Salado',
  'breakfast': 'Desayuno',
  'dessert_mix': 'Mix de Postres',
  'full_meal': 'Comida Completa',
  'artisan_mix': 'Mix Artesanal'
};

interface ComboProduct {
  product: Product;
  creator: User;
  quantity: number;
}

interface ComboFormData {
  name_es: string;
  description_es: string;
  category: string;
  discount_percentage: number;
  preparation_time: number;
  is_featured: boolean;
  available_until: string;
  max_orders: number;
}

export default function NewComboPage() {
  const { canManageOwnProducts, loading: permissionsLoading } = usePermissions();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState<(Product & { creator: User })[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ComboProduct[]>([]);
  
  const [formData, setFormData] = useState<ComboFormData>({
    name_es: '',
    description_es: '',
    category: 'sweet_savory',
    discount_percentage: 10,
    preparation_time: 120,
    is_featured: false,
    available_until: '',
    max_orders: 0
  });

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canManageOwnProducts) {
      router.push('/');
    }
  }, [canManageOwnProducts, permissionsLoading, router]);

  // Cargar productos disponibles
  const loadAvailableProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          users!creator_id (
            id,
            name,
            email,
            profile_picture_url
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const formattedProducts = (productsData || []).map(product => ({
        ...product,
        creator: product.users
      }));

      setAvailableProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los productos"
      });
    }
  };

  useEffect(() => {
    if (canManageOwnProducts) {
      loadAvailableProducts();
    }
  }, [canManageOwnProducts]);

  // Filtrar productos por búsqueda
  const filteredProducts = availableProducts.filter(product =>
    product.name_es.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.creator.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agregar producto al combo
  const addProductToCombo = (product: Product & { creator: User }) => {
    const existingProduct = selectedProducts.find(p => p.product.id === product.id);
    
    if (existingProduct) {
      setSelectedProducts(prev => 
        prev.map(p => 
          p.product.id === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, {
        product,
        creator: product.creator,
        quantity: 1
      }]);
    }
    
    setSearchDialogOpen(false);
    setSearchTerm('');
  };

  // Remover producto del combo
  const removeProductFromCombo = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product.id !== productId));
  };

  // Actualizar cantidad
  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromCombo(productId);
      return;
    }
    
    setSelectedProducts(prev => 
      prev.map(p => 
        p.product.id === productId 
          ? { ...p, quantity }
          : p
      )
    );
  };

  // Cálculos del combo
  const originalPrice = selectedProducts.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );
  const discountAmount = originalPrice * (formData.discount_percentage / 100);
  const finalPrice = originalPrice - discountAmount;
  const maxPreparationTime = Math.max(...selectedProducts.map(item => item.product.preparationTime), 0);

  // Crear combo
  const createCombo = async () => {
    if (!user) return;
    
    if (selectedProducts.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Un combo debe tener al menos 2 productos"
      });
      return;
    }

    if (!formData.name_es.trim() || !formData.description_es.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa todos los campos requeridos"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Crear combo
      const { data: comboData, error: comboError } = await supabase
        .from('combos')
        .insert({
          name_es: formData.name_es,
          description_es: formData.description_es,
          category: formData.category,
          total_price: finalPrice,
          original_price: originalPrice,
          discount_percentage: formData.discount_percentage,
          is_featured: formData.is_featured,
          available_until: formData.available_until || null,
          max_orders: formData.max_orders || null,
          preparation_time: Math.max(formData.preparation_time, maxPreparationTime * 60),
          created_by: user.id
        })
        .select()
        .single();

      if (comboError) throw comboError;

      // Agregar productos al combo
      const comboItems = selectedProducts.map(item => ({
        combo_id: comboData.id,
        product_id: item.product.id,
        creator_id: item.creator.id,
        quantity: item.quantity,
        individual_price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('combo_items')
        .insert(comboItems);

      if (itemsError) throw itemsError;

      toast({
        title: "¡Combo creado!",
        description: `${formData.name_es} ha sido creado exitosamente`
      });

      router.push('/creator/combos');
    } catch (error: any) {
      console.error('Error creating combo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el combo"
      });
    } finally {
      setLoading(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando...
        </div>
      </div>
    );
  }

  if (!canManageOwnProducts) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/creator/combos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Crear Combo Colaborativo
          </h1>
          <p className="text-muted-foreground">
            Combina productos de diferentes creadores para crear ofertas atractivas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Combo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Combo *</Label>
                <Input
                  id="name"
                  placeholder="ej: Combo Dulce & Salado"
                  value={formData.name_es}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_es: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe la experiencia que ofrece este combo..."
                  value={formData.description_es}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_es: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preparation">Tiempo Preparación (min)</Label>
                  <Input
                    id="preparation"
                    type="number"
                    min="60"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) || 120 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOrders">Límite de Pedidos (opcional)</Label>
                  <Input
                    id="maxOrders"
                    type="number"
                    min="0"
                    placeholder="0 = sin límite"
                    value={formData.max_orders}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_orders: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableUntil">Disponible hasta (opcional)</Label>
                <Input
                  id="availableUntil"
                  type="datetime-local"
                  value={formData.available_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, available_until: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: !!checked }))}
                />
                <Label htmlFor="featured">Marcar como destacado</Label>
              </div>
            </CardContent>
          </Card>

          {/* Productos del combo */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Productos del Combo ({selectedProducts.length})</CardTitle>
                <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Seleccionar Productos</DialogTitle>
                      <DialogDescription>
                        Busca y selecciona productos de cualquier creador para tu combo
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar productos o creadores..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <div className="relative">
                              <Image
                                src={product.image_url || '/placeholder-product.jpg'}
                                alt={product.name_es}
                                width={200}
                                height={150}
                                className="w-full h-32 object-cover rounded-t-lg"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge variant="outline" className="bg-white/90">
                                  {formatPrice(product.price)}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-3">
                              <h4 className="font-medium text-sm line-clamp-1">{product.name_es}</h4>
                              <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={product.creator.profile_picture_url} />
                                  <AvatarFallback className="text-xs">{product.creator.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{product.creator.name}</span>
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => addProductToCombo(product)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Agregar
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="mx-auto h-12 w-12 mb-4" />
                  <p>No has agregado productos aún</p>
                  <p className="text-sm">Un combo necesita al menos 2 productos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedProducts.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Image
                        src={item.product.image_url || '/placeholder-product.jpg'}
                        alt={item.product.name_es}
                        width={60}
                        height={60}
                        className="w-15 h-15 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name_es}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={item.creator.profile_picture_url} />
                            <AvatarFallback className="text-xs">{item.creator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{item.creator.name}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{item.product.preparationTime}h</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.product.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                        <span className="text-sm font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProductFromCombo(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen del combo */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumen del Combo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Precio original:</span>
                  <span>{formatPrice(originalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento ({formData.discount_percentage}%):</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Precio final:</span>
                  <span className="text-green-600">{formatPrice(finalPrice)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Productos:</span>
                  <span>{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Creadores:</span>
                  <span>{new Set(selectedProducts.map(p => p.creator.id)).size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo prep.:</span>
                  <span>{Math.ceil(Math.max(formData.preparation_time, maxPreparationTime * 60) / 60)}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Ahorro cliente:</span>
                  <span className="text-green-600">{formatPrice(discountAmount)}</span>
                </div>
              </div>

              {selectedProducts.length >= 2 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Distribución de Ganancias:</h4>
                    {Array.from(new Set(selectedProducts.map(p => p.creator.id))).map(creatorId => {
                      const creator = selectedProducts.find(p => p.creator.id === creatorId)?.creator;
                      const creatorProducts = selectedProducts.filter(p => p.creator.id === creatorId);
                      const creatorTotal = creatorProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                      const creatorPercentage = ((creatorTotal / originalPrice) * 100).toFixed(1);
                      const creatorEarnings = (creatorTotal * 0.9); // 90% para el creador

                      return (
                        <div key={creatorId} className="flex justify-between text-xs">
                          <span>{creator?.name}</span>
                          <span>{creatorPercentage}% ({formatPrice(creatorEarnings)})</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <Button 
                onClick={createCombo}
                disabled={loading || selectedProducts.length < 2 || !formData.name_es.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Crear Combo
                  </>
                )}
              </Button>

              {selectedProducts.length < 2 && (
                <p className="text-xs text-muted-foreground text-center">
                  Agrega al menos 2 productos para crear el combo
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
