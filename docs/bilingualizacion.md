# Plan de bilingüalización (pendiente de aplicar)

## Objetivo
Identificar y traducir todos los textos en duro (ES/EN) a través de diccionarios `src/dictionaries/es.ts` y `src/dictionaries/en.ts`, asegurando que checkout, carrito y paneles usen `dict`/`useTranslations`.

## Áreas a auditar (prioridad)
- `src/app/checkout/page.tsx`: toasts, validación dirección/ubicación, errores de delivery no disponible, labels y títulos.
- `src/components/cart/CartView.tsx` y vistas de carrito: botones, avisos, estados vacíos.
- `src/components/ui/location-selector.tsx`, `src/hooks/useGeolocation.ts`: mensajes de GPS, permisos, CTA confirmar ubicación.
- `src/app/user/orders/page.tsx`: estados, botones (cancelar), políticas 48h, avisos de teléfono/IVA.
- `src/app/user/profile/page.tsx`: labels, placeholders, errores y mensajes de éxito.
- `src/app/creator/**` (productos, pedidos, combos): tablas, headers, filtros, toasts.
- `src/app/admin/**` (analytics, creators, products): headings, filtros, métricas.
- `src/components/shared/SiteHeader.tsx` / navegación: menús, CTA login/signup/logout, badge de carrito.
- `src/components/category/CategoryCarousel.tsx` y `src/app/products/[category]`: títulos/descripciones.
- `src/components/ui/privacy-settings.tsx`: textos y botones.
- `src/app/offers`, `src/app/combos`, `src/app/creator/combos/*`: CTAs, labels.
- Mensajes de WhatsApp en `src/lib/services/orders.ts`: plantillas ES/EN.
- Servicios/hooks: errores genéricos en ES.

## Patrón de implementación
1) Inventario de textos duros: buscar acentos/palabras clave (“Entrega”, “Pedido”, “Ubicación”, “Carrito”, “Guardar”, “Cancelar”, “Confirmar”, “WhatsApp”, “servicio”) con `rg` y revisar manual en los archivos listados.
2) Mapeo a diccionarios: crear/usar claves en `es.ts` y `en.ts` (evitar duplicados).
3) Consumir diccionarios: usar `getDictionary`/`useTranslations` y pasar `dict` a componentes; reemplazar strings duros.
4) Placeholders y labels: inputs de checkout, profile, login/signup, selects de depto/muni, fecha/entrega, notas.
5) Estados vacíos/tablas: headers, “sin datos”, columnas en creador/admin/user.
6) Mensajes de error/success/toasts: validación dirección vs ubicación, delivery no disponible, permisos GPS, formularios.
7) WhatsApp: centralizar número/URL; plantillas ES/EN en `orders.ts` y en toasts (checkout).
8) Prueba manual en EN: checkout (form+mapa+toasts), carrito, user orders, profile, creator orders, admin analytics; verificar que no quede texto en español residual.

## Casos observados actuales
- Checkout: mensajes de validación y delivery no disponible en ES (incluye WhatsApp soporte); deben ir a diccionario y tener versión EN.
- Carrito: probable presencia de botones/avisos en ES.
- Página de checkout: títulos/formularios no cambian a EN; requiere dict en labels/placeholders.

## Entregable esperado
- Lista de claves nuevas en `es.ts` y `en.ts`.
- Reemplazo de strings duros en componentes listados.
- Verificación manual en EN con toasts/errores/traducciones visibles.

