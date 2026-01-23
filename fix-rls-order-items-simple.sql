-- Solución simple para RLS de order_items sin joins ni recursion
-- Permite:
--   - Clientes: leer sus propios items vía orders.user_id
--   - Creadores: leer items de sus productos vía products.creator_id

-- 1) Eliminar políticas previas que puedan causar recursion/infinite loops
drop policy if exists "order_items_select_any" on order_items;
drop policy if exists "order_items_select_creator" on order_items;
drop policy if exists "order_items_select_customer" on order_items;
drop policy if exists "order_items_select_creator_simple" on order_items;
drop policy if exists "order_items_select_customer_simple" on order_items;

-- Helpers SECURITY DEFINER para evitar recursion con RLS en subconsultas
create or replace function order_item_visible_to_customer(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from orders o
    where o.id = p_order_id
      and o.user_id = auth.uid()
  );
$$;

create or replace function order_item_visible_to_creator(p_product_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from products p
    where p.id = p_product_id
      and p.creator_id = auth.uid()
  );
$$;

-- 2) Política de lectura para clientes (usa función definer, sin joins directos)
create policy "order_items_select_customer_simple"
  on order_items
  for select
  to authenticated
  using (order_item_visible_to_customer(order_id));

-- 3) Política de lectura para creadores (usa función definer, sin joins directos)
create policy "order_items_select_creator_simple"
  on order_items
  for select
  to authenticated
  using (order_item_visible_to_creator(product_id));

-- Nota:
-- - No hay joins ni auto-referencias a order_items, se evita el 42P17 (infinite recursion).
-- - Las políticas se pueden ejecutar directamente en el SQL Editor de Supabase.

