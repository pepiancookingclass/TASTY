# 🍳 TASTY - Instrucciones para Agentes IA

> **Última actualización:** 1 Marzo 2026 (v2)  
> **Idioma:** Siempre responder en ESPAÑOL

---

## 📋 RESUMEN EJECUTIVO

**TASTY** es un marketplace de comida artesanal en Guatemala. Conecta creadores (pasteleros, cocineros) con clientes.

### ✅ **LO QUE FUNCIONA (NO TOCAR)**
| Sistema | Estado | Archivo Principal |
|---------|--------|-------------------|
| Emails de pedidos | ✅ FUNCIONA | `supabase/functions/send-email/index.ts` |
| Emails de bienvenida | ✅ FUNCIONA | `supabase/functions/send-welcome-email/index.ts` |
| Carrito persistente | ✅ FUNCIONA | `src/context/CartProvider.tsx` |
| Checkout completo | ✅ FUNCIONA | `src/app/checkout/page.tsx` |
| Traducciones ES/EN | ✅ FUNCIONA | `src/dictionaries/es.ts`, `en.ts` |
| Panel creador | ✅ FUNCIONA | `src/app/creator/*` |
| Sistema delivery moto/auto | ✅ FUNCIONA | Calculado por creador |
| Analytics de visitantes | ✅ FUNCIONA | `src/hooks/useVisitorAnalytics.ts` |
| Dashboard analytics | ✅ FUNCIONA | `src/app/admin/analytics/page.tsx` |
| Sistema promociones | ✅ FUNCIONA | `src/app/admin/promotions/page.tsx` |
| Galería multi-imagen | ✅ FUNCIONA | `src/components/product/ProductCard.tsx` |
| Auto-guardado formularios | ✅ FUNCIONA | Formularios de producto |

---

## 🔴 ARCHIVOS QUE NUNCA DEBES MODIFICAR

| Archivo | Razón |
|---------|-------|
| `supabase/functions/send-email/index.ts` | Sistema de emails FUNCIONA |
| `supabase/functions/send-welcome-email/index.ts` | Emails de bienvenida FUNCIONA |
| `src/lib/services/orders.ts` | Creación de órdenes FUNCIONA |
| `src/context/CartProvider.tsx` | Carrito FUNCIONA |
| `src/providers/auth-provider.tsx` | Autenticación FUNCIONA |
| `next.config.ts` | Configuración Next.js |

---

## ✅ ARCHIVOS QUE SÍ PUEDES MODIFICAR

| Directorio | Para qué |
|------------|----------|
| `src/app/*/page.tsx` | Páginas de la app |
| `src/components/**/*.tsx` | Componentes de UI |
| `src/dictionaries/*.ts` | Traducciones ES/EN |
| `src/hooks/*.ts` | Custom hooks |
| `public/**/*` | Archivos estáticos |

---

## 🤖 INSTRUCCIONES PARA IA ECONÓMICA

### TU TRABAJO ES SIMPLE:
1. **Leer este archivo COMPLETO antes de hacer cualquier cosa**
2. **Solo modificar lo que te pidan**
3. **NO refactorizar, NO "mejorar" código que funciona**
4. **Preguntar si no entiendes**

### REGLAS OBLIGATORIAS:

#### REGLA 1: LEE ANTES DE ESCRIBIR
```
❌ MAL: Modificar un archivo sin leerlo
✅ BIEN: Leer el archivo COMPLETO, entender, luego modificar
```

#### REGLA 2: UN CAMBIO A LA VEZ
```
❌ MAL: Modificar 5 archivos "para estar seguro"
✅ BIEN: Modificar 1 archivo, probar, confirmar
```

#### REGLA 3: NO ELIMINES CÓDIGO
```
❌ MAL: "Este código parece obsoleto, lo elimino"
✅ BIEN: Preguntar al usuario antes de eliminar algo
```

#### REGLA 4: RESPONDE EN ESPAÑOL
```
❌ MAL: Responder en inglés
✅ BIEN: Todo en español
```

---

## 📋 TAREAS PENDIENTES (Priorizadas)

### 🔥 PRIORIDAD ALTA (Para Lanzamiento)

#### 1. Dominio + Resend (CONFIGURACIÓN EXTERNA)
- **Estado:** ✅ COMPLETADO (13 Feb 2026) — Dominio `tasty.lat` verificado en Resend, FROM `notifications@tasty.lat`, destinos reales habilitados (cliente/creadores) y admin sigue recibiendo copia.
- **Notas:** `send-email` y `send-welcome-email` redeployadas con nuevo FROM; links en correos ya usan `tasty.lat`.
- **Impacto:** Correo real habilitado; mantener API key y dominio en Resend.

#### 2. QA WhatsApp (SOLO PROBAR)
- **Qué verificar en próximo pedido real:**
  - ✅ Mensaje incluye IVA
  - ✅ Mensaje incluye teléfono del cliente
  - ✅ Mensaje incluye tipo de vehículo (Moto/Auto)
  - ✅ Mensaje incluye nombres reales de creadores
- **Archivo:** `src/lib/services/orders.ts` → `generateCustomerWhatsAppUrl()`
- **Acción:** Solo probar, código ya está correcto

#### 3. QA Checkout Completo (SOLO PROBAR)
- **Qué verificar:**
  - Prefill de datos desde perfil
  - Delivery calcula por distancia
  - Nombres de creadores en breakdown (no "CREADOR")
  - Validación de dirección no bloquea (usa `pending_verification`)
- **Acción:** Solo probar en navegador

### 🟡 PRIORIDAD MEDIA

#### 4. Warning de Delivery Alto (> Q100)
- **Estado:** ✅ COMPLETADO (14 Feb 2026)
- **Implementación:** Banner amarillo en checkout si algún creador tiene delivery > Q100
- **Texto:** "⚠️ Delivery alto (>Q100) por distancia (~X km). Deberás confirmar con servicio al cliente la disponibilidad y horario de entrega."
- **Archivos modificados:** `src/app/checkout/page.tsx`, `src/dictionaries/es.ts`, `src/dictionaries/en.ts`

#### 6. Sistema de Combos
- **Estado:** Implementado pero sin QA reciente
- **Qué hacer:** Probar flujo completo:
  1. Crear combo desde `/creator/combos/new`
  2. Ver combo público en `/combos`
  3. Comprar combo (agregar al carrito, checkout)
- **Archivos:** `src/app/creator/combos/new/page.tsx`, `src/app/combos/page.tsx`

### ✅ COMPLETADO RECIENTEMENTE

#### Rediseño de Emails
- **Estado:** ✅ COMPLETADO (1 Mar 2026)
- **Implementación:**
  - **Formato unificado:** Todos los emails usan diseño monospace con líneas separadoras
  - **Email cliente:** Desglose claro por creador con productos, IVA, delivery y total a pagar
  - **Email creador:** Info financiera clara (ganancia 90%, comisión TASTY 10%)
  - **Email bienvenida:** Formato alineado para creadores y clientes
  - **Sin duplicación de precios:** Eliminado el formato "Q175 (Q175)" cuando qty=1
  - **Nombres truncados:** Productos largos se cortan a 30-35 caracteres
- **Archivos modificados:**
  - `supabase/functions/send-email/index.ts` — Email cliente/admin/creador rediseñado
  - `supabase/functions/send-welcome-email/index.ts` — Email bienvenida rediseñado

#### Sistema de Delivery Mejorado
- **Estado:** ✅ COMPLETADO (1 Mar 2026)
- **Implementación:**
  - **Tarifas separadas moto/carro:** Creadores configuran tarifas independientes para cada vehículo
  - **Radio de entrega 50km:** Default aumentado de 25km a 50km (cubre Antigua-Guatemala)
  - **Factor de corrección 1.4:** Distancia calculada considera ruta real vs línea recta
  - **Zona del creador visible:** Se muestra ciudad/departamento en checkout, carrito y ficha de producto
  - **Warning distancia larga (>50km):** Banner rojo con botón WhatsApp para coordinar entregas lejanas
  - **Bloqueo sin ubicación:** Si creador no tiene ubicación configurada, se bloquea el pedido
  - **Inputs sin decimales:** Tarifas en quetzales enteros para fácil uso en móvil
- **Archivos modificados:**
  - `src/app/checkout/page.tsx` — Warning distancia, zona creador, bloqueo sin ubicación
  - `src/app/user/profile/page.tsx` — Tarifas moto/carro separadas, radio 50km
  - `src/components/cart/CartView.tsx` — Zona del creador en header
  - `src/components/product/ProductCard.tsx` — Zona del creador junto al nombre
  - `src/lib/types.ts` — Campos addressCity, addressState en Creator
  - `src/lib/services/users.ts` — Transform incluye zona
  - `src/dictionaries/es.ts`, `en.ts` — Traducciones nuevas
- **SQL actualizado:** Función `calculate_creator_delivery_fee` usa tarifas moto/auto y retorna `NO_LOCATION` si falta ubicación

#### Login con Google OAuth + Sistema de Disponibilidad
- **Estado:** ✅ COMPLETADO (20 Feb 2026)
- **Implementación:**
  - **Google OAuth:** Login/registro con cuenta de Google funcionando
  - **Auth callback:** Ruta `/auth/callback` maneja el redirect de Google
  - **Disponibilidad creadores:** Estados available/vacation/busy con guardado instantáneo
  - **Guardado dinámico:** Botones de estado guardan directo a BD sin necesidad de "Guardar"
  - **Panel admin:** Admins pueden cambiar estado de cualquier creador
  - **ProductCard:** Muestra badges y deshabilita compra según estado del creador
  - **Página creador:** Banners de "vacaciones" o "agenda llena" en perfil público
- **Archivos nuevos:**
  - `src/app/auth/callback/route.ts` — Maneja callback de Google OAuth
- **Archivos modificados:**
  - `src/app/user/profile/page.tsx` — Selector de disponibilidad con guardado instantáneo
  - `src/app/admin/creators/page.tsx` — Control de disponibilidad por admin
  - `src/app/creators/[id]/page.tsx` — Banners de estado
  - `src/components/product/ProductCard.tsx` — Badges y lógica de no disponible
  - `src/lib/types.ts` — Tipo AvailabilityStatus
  - `src/lib/services/users.ts` — Transform con availabilityStatus

#### Galería Multi-Imagen + Auto-guardado
- **Estado:** ✅ COMPLETADO (19 Feb 2026)
- **Implementación:**
  - **Multi-imagen:** Los creadores pueden subir hasta 6 fotos por producto
  - **Carrusel lightbox:** Click en imagen abre galería a pantalla completa
  - **Miniaturas:** Navegación con flechas y miniaturas clickeables
  - **Indicador:** Badge "1/6" en tarjetas con múltiples imágenes
  - **Estado agotado:** Creadores pueden marcar productos como "AGOTADO"
  - **Auto-guardado:** Formularios guardan automáticamente en localStorage
  - **Restauración:** Al volver a la página, recupera cambios no guardados
  - **Borradores expiran:** Después de 24 horas se eliminan automáticamente
- **Archivos nuevos:**
  - `sql/add-product-gallery.sql` — Columnas `image_urls` y `is_sold_out`
  - `src/components/ui/multi-image-upload.tsx` — Upload múltiple con reordenar
  - `src/components/product/ProductImageCarousel.tsx` — Carrusel standalone
- **Archivos modificados:**
  - `src/lib/types.ts` — Agregado `imageUrls[]` e `isSoldOut` al tipo Product
  - `src/lib/services/products.ts` — CRUD actualizado para arrays
  - `src/components/product/ProductCard.tsx` — Lightbox + badge agotado
  - `src/components/creator/NewProductForm.tsx` — Multi-upload + auto-save
  - `src/app/creator/products/[id]/edit/page.tsx` — Multi-upload + auto-save
  - `src/app/creators/[id]/page.tsx` — Transformación de productos actualizada

#### Sistema de Promociones
- **Estado:** ✅ COMPLETADO (16 Feb 2026)
- **Implementación:**
  - **Tabla SQL:** `promotions` con descuentos %, fijos, productos gratis, bundles
  - **RLS:** Creadores gestionan las suyas, admins gestionan todas
  - **CRUD completo:** Crear, editar, eliminar, activar/desactivar promociones
  - **Códigos promocionales:** Soporte para códigos con validación y límites de uso
  - **Panel Admin:** `/admin/promotions` para gestionar todas las promociones
  - **Panel Creador:** `/creator/promotions` para gestionar promociones propias
- **Archivos nuevos:**
  - `sql/create-promotions-system.sql` — Tablas, RLS y funciones
  - `src/lib/services/promotions.ts` — CRUD de promociones
  - `src/app/admin/promotions/page.tsx` — Panel admin completo
- **Archivos modificados:**
  - `src/app/creator/promotions/page.tsx` — Ahora usa BD (antes era datos estáticos)
  - `src/components/creator/CreatorSidebar.tsx` — Link actualizado
  - `src/components/admin/AdminFloatingMenu.tsx` — Link a promociones

#### Sistema de Analytics Completo + Filtrado Inteligente
- **Estado:** ✅ COMPLETADO (16 Feb 2026)
- **Implementación:**
  - **Triple sistema:** Analytics interno + Google Analytics 4 + Microsoft Clarity
  - **Tracking interno:** Hook `useVisitorAnalytics` trackea page views, product views, add to cart, purchases
  - **API Route:** `/api/analytics/track` guarda en Supabase con geolocalización de Vercel
  - **Dashboard admin:** Visitantes únicos, dispositivos, países, fuentes de tráfico, conversión
  - **Filtrado inteligente:** GA4 y Clarity NO trackean admins/creators (datos 100% limpios)
  - **Sesión persistente:** Admins mantienen sesión abierta días/semanas sin relogueo
  - **Google Analytics 4:** Integrado (ID: G-MJSSW7R01F) solo para usuarios reales
  - **Microsoft Clarity:** Integrado (ID: vicdzd41fb) solo para usuarios reales
- **Archivos nuevos:**
  - `sql/create-visitor-analytics.sql` — Tabla y funciones SQL
  - `src/app/api/analytics/track/route.ts` — API que guarda eventos
  - `src/hooks/useVisitorAnalytics.ts` — Hook para trackear eventos
  - `src/components/analytics/PageViewTracker.tsx` — Auto-track de page views
  - `src/components/analytics/ConditionalAnalytics.tsx` — Carga GA4/Clarity condicionalmente
  - `GUIA-ANALYTICS-GA4-CLARITY.md` — Documentación completa del sistema
  - `GUIA_ANALYTICS_ECOMMERCE_DELIVERY_TASTY.md` — Roadmap futuro para métricas avanzadas
- **Archivos modificados:**
  - `src/lib/services/analytics.ts` — Funciones para visitor stats + filtrado de roles
  - `src/app/admin/analytics/page.tsx` — Dashboard con tráfico web + header responsive
  - `src/app/layout.tsx` — ConditionalAnalytics + PageViewTracker
  - `src/components/shared/HelpSticker.tsx` — Botón WhatsApp reposicionado

### ⚪ PRIORIDAD BAJA (Futuro)

#### 7. Analytics Avanzados E-commerce + Delivery
- **Descripción:** Métricas específicas de food delivery (embudo completo, revenue por creador, zonas de delivery, horarios pico)
- **Referencia:** `GUIA_ANALYTICS_ECOMMERCE_DELIVERY_TASTY.md` (implementación de Shugu adaptada)
- **ROI esperado:** +15-40% conversión, +25% AOV, insights de negocio profundos
- **Cuándo implementar:** Cuando tengamos 100+ órdenes/mes y necesitemos optimizar conversión
- **Complejidad:** Media-Alta (3-6 semanas desarrollo)

#### 8. Videos Cortos de Productos
- **Descripción:** Permitir clips de 10-15 segundos
- **Complejidad:** Alta (requiere storage, thumbnails, compresión)
- **Acción:** Dejar para después del lanzamiento

---

## 🏗️ ARQUITECTURA CLAVE

### Sistema de Emails
```
App (orders.ts) → INSERT orden → INSERT items → fetch() Edge Function → Resend API → ✅ EMAILS
```

**¿Por qué así?**
- Supabase usa PgBouncer (connection pooling)
- Triggers SQL con `http()` NO FUNCIONAN a través del pooler
- Solución: Llamar Edge Function directamente desde la app

### Sistema de Delivery
```
Producto tiene delivery_vehicle (moto/auto) → Checkout agrupa por creador → 
Calcula tarifa por vehículo → Muestra breakdown → Guarda en order
```

**Archivos clave:**
- `src/app/checkout/page.tsx` - Cálculo de delivery
- `supabase/functions/send-email/index.ts` - Muestra vehículo en emails

### Zona Horaria
- **Guatemala = UTC-6**
- Funciones `formatDateGuatemala()` y `getCurrentDateGuatemala()` ya lo manejan

---

## 🧪 CÓMO PROBAR

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# El proyecto corre en http://localhost:3000
```

### Credenciales de Prueba
- **Admin:** `ruajhostal@gmail.com` / `admin123`

---

## 📊 ESTRUCTURA DE BD (Solo referencia)

### Tabla: orders
- `id`, `user_id`, `customer_name`, `status`, `total`
- `delivery_fee`, `delivery_breakdown` (JSONB con breakdown por creador)
- `subtotal`, `iva_amount`

### Tabla: order_items
- `order_id`, `product_id`, `quantity`, `unit_price`
- `delivery_vehicle` (moto/auto)

### Tabla: products
- `creator_id`, `name_es`, `name_en`, `price`
- `delivery_vehicle` (moto/auto por defecto)
- `preparation_time` (horas)
- `image_url` (imagen principal para compatibilidad)
- `image_urls` (TEXT[] array de hasta 6 imágenes)
- `is_sold_out` (BOOLEAN para marcar agotado)

---

## ✅ BUGS RESUELTOS (No investigar)

| Bug | Estado | Fecha |
|-----|--------|-------|
| delivery_vehicle se pierde en checkout | ✅ RESUELTO | 14 Feb 2026 |
| Eliminación productos bloquea página | ✅ RESUELTO | 13 Feb 2026 |
| RLS order_items recursión | ✅ RESUELTO | 13 Feb 2026 |
| Carrito no persiste | ✅ RESUELTO | Ene 2026 |
| Loop infinito CartView | ✅ RESUELTO | Ene 2026 |
| Emails no se envían | ✅ RESUELTO | Ene 2026 |

**Nota bug delivery_vehicle:** El checkout ahora consulta `delivery_vehicle` directamente de la BD para evitar datos obsoletos del carrito guardado. Ver `docs/bug-delivery-vehicle.md` para detalles.

---

## 📝 CUANDO TERMINES UNA TAREA

1. **Actualiza este archivo** si completaste algo
2. **Di qué archivos modificaste**
3. **Da instrucciones claras** de cómo probar

---

*Última actualización: 20 Febrero 2026 - Login con Google OAuth + Sistema de disponibilidad de creadores (vacation/busy/available) con guardado instantáneo*
