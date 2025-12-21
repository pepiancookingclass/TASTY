'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, Loader2, Clock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface StatusHistoryItem {
  status: string;
  changed_at: string;
  changed_by_name: string;
  notes: string;
}

interface OrderStatusHistoryProps {
  orderId: string;
}

const statusLabels: Record<string, string> = {
  'new': 'Nuevo',
  'preparing': 'En Preparación',
  'ready': 'Listo para Recoger',
  'out_for_delivery': 'En Camino',
  'delivered': 'Entregado',
  'cancelled': 'Cancelado',
};

const statusColors: Record<string, string> = {
  'new': 'bg-blue-100 text-blue-800',
  'preparing': 'bg-yellow-100 text-yellow-800',
  'ready': 'bg-green-100 text-green-800',
  'out_for_delivery': 'bg-purple-100 text-purple-800',
  'delivered': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export function OrderStatusHistory({ orderId }: OrderStatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadHistory = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_order_status_history', { order_uuid: orderId });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading order history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, orderId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Ver Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial del Pedido #{orderId.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Cargando historial...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay historial disponible para este pedido
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="relative">
                  {/* Línea de conexión */}
                  {index < history.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Indicador de estado */}
                    <div className="flex-shrink-0">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}
                      `}>
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={statusColors[item.status] || 'bg-gray-100 text-gray-800'}>
                          {statusLabels[item.status] || item.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.changed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-3 w-3" />
                        <span>Actualizado por: {item.changed_by_name}</span>
                      </div>
                      
                      {item.notes && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                          <strong>Notas:</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < history.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
