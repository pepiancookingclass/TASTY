# Plan: Vehículo de entrega (carro vs moto) por producto/creador

## Objetivo
Permitir que el creador marque cada producto como “requiere carro” o “apto moto”, que el cálculo de delivery use la tarifa adecuada (carro o moto), y que el cliente reciba el desglose y la explicación del medio de entrega en checkout, emails y WhatsApp.

## Alcance
- Producto: flag de medio de entrega por ítem (carro | moto | auto/ambos con default “moto”).
- Creador: dos tarifas paralelas (carro y moto): base + por km; mismo radio.
- Cálculo de delivery: elegir tarifa por creador según el requerimiento de los productos del carrito; incluir vehículo en el breakdown.
- UX cliente: mostrar en checkout/resumen qué entregas van en carro vs moto y por qué.
- UX creador/admin: ver en emails y dashboard qué vehículo aplicar.

## Diseño de datos (Supabase)
1) Tabla `users` (creador):
   - Nuevas columnas:
     - `creator_base_delivery_fee_car` DECIMAL(8,2) DEFAULT 25.00
     - `creator_per_km_fee_car` DECIMAL(8,2) DEFAULT 3.00
     - `creator_base_delivery_fee_moto` DECIMAL(8,2) DEFAULT 15.00 (si antes era 15, reutilizar)
     - `creator_per_km_fee_moto` DECIMAL(8,2) DEFAULT 2.00
   - Mantener `creator_delivery_radius`.
2) Tabla `products`:
   - Columna `delivery_vehicle` ENUM('moto','carro','auto') DEFAULT 'moto'
     - ‘auto’ significa “el creador decide/ambos”; mientras no haya regla, usar moto por compatibilidad.
3) Tabla `order_items`:
   - Columna `delivery_vehicle` (guardar el vehículo requerido en el momento del pedido).
4) Tabla `orders` / `delivery_breakdown`:
   - Extender el JSON de breakdown por creador con `vehicle: 'carro' | 'moto'`.

## Lógica de cálculo (funciones SQL)
1) `calculate_creator_delivery_fee`:
   - Añadir parámetro `vehicle TEXT DEFAULT 'moto'`.
   - Elegir base/per_km según vehicle (carro/moto).
   - Mantener primeros 3 km incluidos y radio.
   - Resultado incluir `vehicle`.
2) `calculate_order_total_delivery`:
   - Por creador, si **al menos un** producto requiere carro, toda la entrega de ese creador se cobra como carro (los productos “moto” se entregan junto con el carro).
   - Si todos los productos del creador son moto/auto, usar vehicle='moto'.
   - Retornar breakdown con vehicle.
3) Migración:
   - Backfill productos existentes a `delivery_vehicle='moto'`.
   - Copiar tarifas actuales a campos “moto”; setear campos “carro” con los nuevos defaults.

## Frontend (creador)
1) Formulario de creación/edición de producto:
   - Selector de “Medio de entrega”: { moto (default), carro, automático }.
   - Guardar en `products.delivery_vehicle`.

## Frontend (cliente)
1) Checkout:
   - Al calcular delivery, enviar vehicle por creador: si algún producto del creador requiere carro → vehicle='carro', else 'moto'.
   - Mostrar en el panel de “Delivery múltiple” el vehículo por creador: “Entrega en carro” / “Entrega en moto” + costo + distancia.
   - En resumen total, no cambiar totales, solo texto explicativo.
2) Mensajería:
   - Emails cliente/admin/creador: incluir vehicle en el desglose de delivery por creador.
   - WhatsApp cliente: agregar línea “Entrega: carro/moto” en el bloque de delivery.

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

