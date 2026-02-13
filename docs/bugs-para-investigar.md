# Bugs pendientes a investigar

## 1) Eliminación de productos bloquea la página (creator/products)
- **Síntoma:** Tras eliminar un producto desde `/creator/products`, el producto se elimina en BD pero la UI queda "trabada" (no se puede hacer clic) hasta refrescar.
- **Causa raíz:** El `DropdownMenu` de Radix no se cierra automáticamente cuando se abre el `Dialog` desde dentro. El backdrop del dropdown queda activo bloqueando eventos.
- **FIX APLICADO (13 Feb 2026):**
  - Añadido estado `openDropdownId` para controlar explícitamente qué dropdown está abierto.
  - `DropdownMenu` ahora usa `open={openDropdownId === product.id}` y `onOpenChange`.
  - En `handleDeleteClick`, se cierra el dropdown (`setOpenDropdownId(null)`) y luego con un pequeño delay (50ms) se abre el diálogo.
  - Esto asegura que el backdrop del dropdown se desmonte antes de montar el del diálogo.
- **Código:** `src/components/creator/ProductTable.tsx`
- **Estado:** ✅ RESUELTO (13 Feb 2026) - Probado y funcionando.

## 2) RLS en order_items: creadores no ven pedidos (42P17 infinite recursion)
- **Síntoma:** En `/creator/orders` los creadores no ven pedidos; en Supabase sale error `42P17 infinite recursion`.
- **Sospecha:** Policies RLS de `order_items` referencian tablas con joins recursivos (`orders` ↔ `order_items` ↔ `products`).
- **Código de carga (con logs):** `src/context/OrderProvider.tsx`
  - Paso 1: trae `products` del creador (sin join).
  - Paso 2: trae `order_items` filtrando por `product_id`.
  - Paso 3: trae `orders` por id.
  - Paso 4: trae `order_items` por orden y `product_id` del creador.
  - Se añadieron logs de error con `message/details/hint/code` para detectar la policy que falla.
- **Idea de fix RLS (sin recursión):**
  - Policy cliente: `order_items` visible si `EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())`.
  - Policy creador: `order_items` visible si `EXISTS (SELECT 1 FROM products p WHERE p.id = order_items.product_id AND p.creator_id = auth.uid())`.
  - Evitar joins adicionales o vistas que reconsulten `order_items`.
- **Estado:** ✅ RESUELTO - El código actual (`OrderProvider.tsx`) hace queries separadas sin joins, evitando la recursión de RLS. Probado: creador ve pedidos correctamente.
