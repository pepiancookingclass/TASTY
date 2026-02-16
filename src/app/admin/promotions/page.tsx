'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Percent,
  Gift,
  Calendar,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionActive,
  type Promotion,
  type CreatePromotionData
} from '@/lib/services/promotions';

export default function AdminPromotionsPage() {
  const { canAccessAdminPanel, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreatePromotionData>({
    title_es: '',
    title_en: '',
    description_es: '',
    description_en: '',
    promotion_type: 'discount',
    discount_percentage: 10,
    is_active: true,
  });

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canAccessAdminPanel) {
      router.push('/');
    }
  }, [canAccessAdminPanel, permissionsLoading, router]);

  // Cargar promociones
  const loadPromotions = async () => {
    setLoading(true);
    const data = await getAllPromotions();
    setPromotions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (canAccessAdminPanel) {
      loadPromotions();
    }
  }, [canAccessAdminPanel]);

  // Abrir dialog para crear
  const handleCreate = () => {
    setEditingPromotion(null);
    setFormData({
      title_es: '',
      title_en: '',
      description_es: '',
      description_en: '',
      promotion_type: 'discount',
      discount_percentage: 10,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  // Abrir dialog para editar
  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title_es: promotion.title_es,
      title_en: promotion.title_en || '',
      description_es: promotion.description_es || '',
      description_en: promotion.description_en || '',
      promotion_type: promotion.promotion_type,
      discount_percentage: promotion.discount_percentage || undefined,
      discount_fixed: promotion.discount_fixed || undefined,
      min_purchase_amount: promotion.min_purchase_amount || undefined,
      promo_code: promotion.promo_code || '',
      start_date: promotion.start_date?.split('T')[0],
      end_date: promotion.end_date?.split('T')[0] || '',
      is_active: promotion.is_active,
      max_uses: promotion.max_uses || undefined,
    });
    setIsDialogOpen(true);
  };

  // Guardar promoción
  const handleSave = async () => {
    if (!formData.title_es) {
      toast({ title: 'Error', description: 'El título es requerido', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      if (editingPromotion) {
        const result = await updatePromotion(editingPromotion.id, formData);
        if (result.success) {
          toast({ title: 'Promoción actualizada', description: 'Los cambios han sido guardados' });
        } else {
          throw new Error(result.error);
        }
      } else {
        const result = await createPromotion(formData);
        if (result.success) {
          toast({ title: 'Promoción creada', description: 'La promoción ha sido creada exitosamente' });
        } else {
          throw new Error(result.error);
        }
      }

      setIsDialogOpen(false);
      loadPromotions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Eliminar promoción
  const handleDelete = async (id: string) => {
    const result = await deletePromotion(id);
    if (result.success) {
      toast({ title: 'Promoción eliminada' });
      loadPromotions();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  // Toggle activo
  const handleToggleActive = async (promotion: Promotion) => {
    const result = await togglePromotionActive(promotion.id, !promotion.is_active);
    if (result.success) {
      toast({ title: promotion.is_active ? 'Promoción desactivada' : 'Promoción activada' });
      loadPromotions();
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (permissionsLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando promociones...
        </div>
      </div>
    );
  }

  if (!canAccessAdminPanel) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Gestión de Promociones
          </h1>
          <p className="text-muted-foreground">
            Crear y administrar promociones y descuentos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Promoción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
              </DialogTitle>
              <DialogDescription>
                {editingPromotion ? 'Modifica los detalles de la promoción' : 'Crea una nueva promoción o descuento'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Título */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_es">Título (Español) *</Label>
                  <Input
                    id="title_es"
                    value={formData.title_es}
                    onChange={(e) => setFormData({ ...formData, title_es: e.target.value })}
                    placeholder="Ej: 20% de descuento"
                  />
                </div>
                <div>
                  <Label htmlFor="title_en">Título (Inglés)</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en || ''}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="Ej: 20% off"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description_es">Descripción (Español)</Label>
                  <Textarea
                    id="description_es"
                    value={formData.description_es || ''}
                    onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                    placeholder="Describe la promoción..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="description_en">Descripción (Inglés)</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en || ''}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Describe the promotion..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Tipo de promoción */}
              <div>
                <Label>Tipo de Promoción</Label>
                <Select
                  value={formData.promotion_type}
                  onValueChange={(value: 'discount' | 'free_item' | 'bundle') => 
                    setFormData({ ...formData, promotion_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">
                      <span className="flex items-center gap-2">
                        <Percent className="h-4 w-4" /> Descuento
                      </span>
                    </SelectItem>
                    <SelectItem value="free_item">
                      <span className="flex items-center gap-2">
                        <Gift className="h-4 w-4" /> Producto Gratis
                      </span>
                    </SelectItem>
                    <SelectItem value="bundle">
                      <span className="flex items-center gap-2">
                        <Tag className="h-4 w-4" /> Bundle/Combo
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos según tipo */}
              {formData.promotion_type === 'discount' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount_percentage">Porcentaje de Descuento (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percentage || ''}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || undefined })}
                      placeholder="Ej: 20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_fixed">O Descuento Fijo (Q)</Label>
                    <Input
                      id="discount_fixed"
                      type="number"
                      min="0"
                      value={formData.discount_fixed || ''}
                      onChange={(e) => setFormData({ ...formData, discount_fixed: parseFloat(e.target.value) || undefined })}
                      placeholder="Ej: 25.00"
                    />
                  </div>
                </div>
              )}

              {formData.promotion_type === 'free_item' && (
                <div>
                  <Label htmlFor="min_purchase_amount">Compra Mínima (Q)</Label>
                  <Input
                    id="min_purchase_amount"
                    type="number"
                    min="0"
                    value={formData.min_purchase_amount || ''}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) || undefined })}
                    placeholder="Ej: 100.00"
                  />
                </div>
              )}

              {/* Código promocional */}
              <div>
                <Label htmlFor="promo_code">Código Promocional (opcional)</Label>
                <Input
                  id="promo_code"
                  value={formData.promo_code || ''}
                  onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                  placeholder="Ej: DESCUENTO20"
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si dejas vacío, la promoción se aplicará automáticamente
                </p>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Fecha de Fin (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Límites */}
              <div>
                <Label htmlFor="max_uses">Límite de Usos (opcional)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || undefined })}
                  placeholder="Dejar vacío para ilimitado"
                />
              </div>

              {/* Activo */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Promoción Activa</Label>
                  <p className="text-xs text-muted-foreground">
                    Las promociones inactivas no se muestran a los clientes
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPromotion ? 'Guardar Cambios' : 'Crear Promoción'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de promociones */}
      <div className="grid gap-4">
        {promotions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay promociones creadas</p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Promoción
              </Button>
            </CardContent>
          </Card>
        ) : (
          promotions.map((promotion) => (
            <Card key={promotion.id} className={!promotion.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      promotion.promotion_type === 'discount' ? 'bg-green-100' :
                      promotion.promotion_type === 'free_item' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {promotion.promotion_type === 'discount' ? (
                        <Percent className="h-6 w-6 text-green-600" />
                      ) : promotion.promotion_type === 'free_item' ? (
                        <Gift className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Tag className="h-6 w-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{promotion.title_es}</h3>
                      {promotion.description_es && (
                        <p className="text-sm text-muted-foreground">{promotion.description_es}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {promotion.discount_percentage && (
                          <Badge variant="default">{promotion.discount_percentage}% OFF</Badge>
                        )}
                        {promotion.discount_fixed && (
                          <Badge variant="default">Q{promotion.discount_fixed} OFF</Badge>
                        )}
                        {promotion.promo_code && (
                          <Badge variant="outline">Código: {promotion.promo_code}</Badge>
                        )}
                        {!promotion.is_active && (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-muted-foreground hidden md:block">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {promotion.current_uses} usos {promotion.max_uses && `/ ${promotion.max_uses}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(promotion)}
                        title={promotion.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {promotion.is_active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(promotion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. La promoción "{promotion.title_es}" será eliminada permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(promotion.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
