'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useDictionary } from '@/hooks/useDictionary';
import { useToast } from '@/hooks/use-toast';

interface StatusStat {
  status: string;
  count: number;
  total_value: number;
}

const statusConfig = {
  'new': {
    labelKey: 'new',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  'preparing': {
    labelKey: 'preparing',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  'ready': {
    labelKey: 'ready',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  'out_for_delivery': {
    labelKey: 'out_for_delivery',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  'delivered': {
    labelKey: 'delivered',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  'cancelled': {
    labelKey: 'cancelled',
    icon: Package,
    color: 'bg-red-100 text-red-800 border-red-200',
  }
};

export function OrderStatusStats() {
  const [stats, setStats] = useState<StatusStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const dict = useDictionary();
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_order_status_stats', { creator_uuid: user.id });

      if (error) {
        console.error('Error loading order stats:', error);
        toast({
          variant: 'destructive',
          title: dict.creatorCombos.errorTitle,
          description: `${error.message || dict.orderStatusStats.sectionTitle} (${error.code || ''})`
        });
        setStats([]);
      } else {
        setStats(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {dict.loading}
        </CardContent>
      </Card>
    );
  }

  // Calcular totales
  const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0);
  const totalValue = stats.reduce((sum, stat) => sum + stat.total_value, 0);
  const activeOrders = stats
    .filter(stat => ['new', 'preparing', 'ready', 'out_for_delivery'].includes(stat.status))
    .reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{dict.orderStatusStats.summaryTotal}</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{dict.orderStatusStats.summaryActive}</p>
                <p className="text-2xl font-bold text-amber-600">{activeOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{dict.orderStatusStats.summaryValue}</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas por estado */}
      <Card>
        <CardHeader>
          <CardTitle>{dict.orderStatusStats.sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(statusConfig).map(([statusKey, config]) => {
              const stat = stats.find(s => s.status === statusKey);
              const count = stat?.count || 0;
              const value = stat?.total_value || 0;
              const Icon = config.icon;

              return (
                <div
                  key={statusKey}
                  className={`
                    rounded-lg border p-4 transition-all hover:shadow-md
                    ${config.color}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-5 w-5" />
                    <Badge variant="secondary" className="bg-white/50">
                      {count}
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold mb-1">{dict.orderStatusStats.status[config.labelKey].label}</h4>
                  <p className="text-xs opacity-80 mb-2">{dict.orderStatusStats.status[config.labelKey].description}</p>
                  
                  {value > 0 && (
                    <p className="text-sm font-medium">
                      {formatCurrency(value)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




