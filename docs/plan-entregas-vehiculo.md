# Plan: Vehículo de entrega (auto vs moto) por producto/creador

## Objetivo
Permitir que el creador marque cada producto como “requiere auto” o “apto moto”, que el cálculo de delivery use la tarifa adecuada (auto o moto), y que el cliente reciba el desglose y la explicación del medio de entrega en checkout, emails y WhatsApp.

## Alcance
- Producto: flag de medio de entrega por ítem (auto | moto; default “moto”).
- Creador: dos tarifas paralelas (auto y moto): base + por km; mismo radio.
- Cálculo de delivery: elegir tarifa por creador según el requerimiento de los productos del carrito; incluir vehículo en el breakdown.
- UX cliente: mostrar en checkout/resumen qué entregas van en auto vs moto y por qué.
- UX creador/admin: ver en emails y dashboard qué vehículo aplicar.

## Diseño de datos (Supabase)
1) Tabla `users` (creador):
   - Nuevas columnas:
     - `creator_base_delivery_fee_auto` DECIMAL(8,2) DEFAULT 25.00
     - `creator_per_km_fee_auto` DECIMAL(8,2) DEFAULT 3.00
     - `creator_base_delivery_fee_moto` DECIMAL(8,2) DEFAULT 15.00 (si antes era 15, reutilizar)
     - `creator_per_km_fee_moto` DECIMAL(8,2) DEFAULT 2.00
   - Mantener `creator_delivery_radius`.
2) Tabla `products`:
   - Columna `delivery_vehicle` ENUM('moto','auto') DEFAULT 'moto'
     - ‘auto’ significa “requiere auto”.
3) Tabla `order_items`:
   - Columna `delivery_vehicle` (guardar el vehículo requerido en el momento del pedido).
4) Tabla `orders` / `delivery_breakdown`:
- Extender el JSON de breakdown por creador con `vehicle: 'auto' | 'moto'`.

## Lógica de cálculo (funciones SQL)
1) `calculate_creator_delivery_fee`:
   - Añadir parámetro `vehicle TEXT DEFAULT 'moto'`.
   - Elegir base/per_km según vehicle (auto/moto).
   - Mantener primeros 3 km incluidos y radio.
   - Resultado incluir `vehicle`.
2) `calculate_order_total_delivery`:
   - Por creador, si **al menos un** producto requiere auto, toda la entrega de ese creador se cobra como auto (los productos “moto” se entregan junto con el auto).
   - Si todos los productos del creador son moto, usar vehicle='moto'.
   - Retornar breakdown con vehicle.
3) Migración:
   - Backfill productos existentes a `delivery_vehicle='moto'`.
   - Copiar tarifas actuales a campos “moto”; setear campos “carro” con los nuevos defaults.

## Frontend (creador)
1) Formulario de creación/edición de producto:
   - Selector de “Medio de entrega”: { moto (default), auto }.
   - Guardar en `products.delivery_vehicle`.

## Frontend (cliente)
1) Checkout:
   - Al calcular delivery, enviar vehicle por creador: si algún producto del creador requiere auto → vehicle='auto', else 'moto'.
   - Mostrar en el panel de “Delivery múltiple” el vehículo por creador: “Entrega en auto” / “Entrega en moto” + costo + distancia.
   - En resumen total, no cambiar totales, solo texto explicativo.
2) Mensajería:
- Emails cliente/admin/creador: incluir vehicle en el desglose de delivery por creador.
- WhatsApp cliente: agregar línea “Entrega: auto/moto” en el bloque de delivery.

## Backend (Edge Function send-email)
- Incluir `vehicle` en el breakdown y en el render (cliente, admin, creadores).

## Compatibilidad y defaults
- Productos sin flag: default moto.
- Creadores sin nuevas columnas: defaults de migración (moto) y usar moto si faltan valores.
- Si un creador no tiene tarifa de carro pero se requiere carro, fallback a moto y marcar warning (opcional log).

## Testing
1) Caso moto: carrito con productos solo moto → tarifas de moto.
2) Caso carro: al menos un producto carro por creador → usa tarifas de carro.
3) Multi-creador mix: un creador carro, otro moto → breakdown muestra ambos.
4) Emails/WhatsApp muestran vehicle.
5) Sin geolocalización creador: sigue usando base-carro/base-moto según vehicle requerido.

## Archivos a tocar (futuro)
- SQL: `add-creator-geolocation.sql` (o nuevo script) para columnas y funciones.
- Front: `src/components/creator/...` (form producto), `src/app/checkout/page.tsx`, `src/lib/services/orders.ts` (pasar vehicle y guardar en order_items), `src/app/user/orders/page.tsx` (mostrar vehicle).
- Edge: `supabase/functions/send-email/index.ts` (render vehicle en breakdown).

---

## ✅ IMPLEMENTADO (09 Feb 2026)

### Archivos creados/modificados:
1. **`add-vehicle-delivery-system.sql`** - Script SQL con todas las migraciones:
   - Columnas nuevas en `users`: `creator_base_delivery_fee_auto`, `creator_per_km_fee_auto`, `creator_base_delivery_fee_moto`, `creator_per_km_fee_moto`
   - Columna `delivery_vehicle` en `products` (enum 'moto'|'auto', default 'moto')
   - Columna `delivery_vehicle` en `order_items`
   - Funciones SQL actualizadas: `calculate_creator_delivery_fee(vehicle)` y `calculate_order_total_delivery` con soporte de vehículo

2. **`src/lib/types.ts`** - Añadido tipo `DeliveryVehicle` y campo `deliveryVehicle` en `Product`

3. **`src/lib/services/products.ts`** - Soporte para leer/guardar `delivery_vehicle`

4. **`src/lib/services/orders.ts`** - Guardar `delivery_vehicle` en `order_items` y soporte en breakdown

5. **`src/components/creator/NewProductForm.tsx`** - Selector de medio de entrega (moto/auto)

6. **`src/app/checkout/page.tsx`** - Determinar vehículo por creador, mostrar en breakdown con emoji 🏍️/🚗

7. **`src/dictionaries/es.ts` y `en.ts`** - Textos para selector de vehículo

### Pendiente:
- [x] Ejecutar `add-vehicle-delivery-system.sql` en Supabase ✅ (09 Feb 2026)
- [x] Actualizar Edge Function `send-email` para incluir `vehicle` en emails ✅ (09 Feb 2026)
- [x] Actualizar mensaje de WhatsApp para incluir vehículo ✅ (09 Feb 2026)
- [x] Checkout muestra nombres reales de creadores ✅ (09 Feb 2026)
- [ ] Probar casos: solo moto, solo auto, mixto, multi-creador (parcial: multi-creador probado OK)

