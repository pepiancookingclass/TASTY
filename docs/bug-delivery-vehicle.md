## Bug: delivery_vehicle se pierde y calcula siempre moto en checkout

### ✅ RESUELTO (14 Feb 2026)

---

### Resumen del Problema
- En BD, productos tienen `delivery_vehicle` correcto (ej: brownies = `auto`, profiteroles = `moto`).
- En checkout, los items llegaban sin `deliveryVehicle` porque el carrito guardado (localStorage/BD) contenía datos antiguos sin ese campo.
- Resultado: `requiresAuto` siempre era `false` y se usaba **moto** aunque debería ser **auto**.

### Causa Raíz
1. Los items en `user_carts` fueron guardados **antes** de implementar `deliveryVehicle`.
2. Al restaurar el carrito, se usaban los datos tal cual sin "hidratar" con la BD.
3. El checkout leía `item.product.deliveryVehicle` que venía como `undefined`.

### Solución Aplicada
**Se modificó `checkout/page.tsx`** para consultar los valores actuales de `delivery_vehicle` directamente desde la BD antes de calcular el tipo de vehículo:

```typescript
// ✅ OBTENER delivery_vehicle ACTUAL desde BD
const allProductIds = items.map(i => i.product.id);
const { data: vehicleData } = await supabase
  .from('products')
  .select('id, delivery_vehicle')
  .in('id', allProductIds);

const vehicleMap: Record<string, string> = {};
vehicleData?.forEach((p) => {
  vehicleMap[p.id] = p.delivery_vehicle || 'moto';
});

// Usar vehicleMap en lugar del valor del carrito
const requiresAuto = creatorItems.some(item => vehicleMap[item.product.id] === 'auto');
```

### Archivos Modificados
- `src/app/checkout/page.tsx` - Consulta BD para `delivery_vehicle` antes de calcular tarifa

### Notas
- La lógica de cálculo siempre estuvo bien: si algún item es `auto`, se usa auto.
- Esta solución es robusta porque siempre obtiene datos frescos de la BD.
- Warning >Q100 funciona independientemente.
