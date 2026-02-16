# 🍳 TASTY - Instrucciones para Agentes IA

> **Última actualización:** 16 Febrero 2026  
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

#### 5. Sistema de Analytics Completo
- **Estado:** ✅ COMPLETADO (16 Feb 2026)
- **Implementación:**
  - **Tracking interno propio:** Hook `useVisitorAnalytics` trackea page views, product views, add to cart, purchases
  - **API Route:** `/api/analytics/track` guarda en Supabase con geolocalización de Vercel
  - **Dashboard admin:** Muestra visitantes únicos, dispositivos, países, fuentes de tráfico, conversión
  - **Filtro anti-ruido:** No trackea admins ni creadores (solo clientes reales)
  - **Google Analytics 4:** Integrado (ID: G-MJSSW7R01F)
  - **Microsoft Clarity:** Integrado (ID: vicdzd41fb) para heatmaps y grabaciones
- **Archivos nuevos:**
  - `sql/create-visitor-analytics.sql` — Tabla y funciones SQL
  - `src/app/api/analytics/track/route.ts` — API que guarda eventos
  - `src/hooks/useVisitorAnalytics.ts` — Hook para trackear eventos
  - `src/components/analytics/PageViewTracker.tsx` — Auto-track de page views
- **Archivos modificados:**
  - `src/lib/services/analytics.ts` — Nuevas funciones para visitor stats
  - `src/app/admin/analytics/page.tsx` — Dashboard con sección de tráfico web
  - `src/app/layout.tsx` — PageViewTracker + GA4 + Clarity scripts

### ⚪ PRIORIDAD BAJA (Futuro)

#### 7. Videos Cortos de Productos
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

*Última actualización: 16 Febrero 2026 - Sistema de Analytics completo implementado (tracking interno + GA4 + Clarity)*
