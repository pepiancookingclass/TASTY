# 🍳 TASTY - Plan de Trabajo para Agentes

> **Última actualización:** 19 Diciembre 2024  
> **Contexto:** Proyecto migrado de Firebase a Supabase  
> **Idioma:** Siempre responder en ESPAÑOL

---

## 🎯 REGLAS PARA EL AGENTE

1. **Responder siempre en español**
2. **Código simple** - No sobrecomplicar, soluciones directas
3. **Usar Supabase directo** en cliente cuando sea posible (evitar APIs innecesarias)
4. **Usar `<img>` nativo** para previews de blob URLs (Next.js Image no los soporta)
5. **Probar después de cada cambio**
6. **Actualizar este archivo** cuando completes una tarea

---

## ✅ YA COMPLETADO

- [x] Migración Firebase → Supabase (Auth, DB, Storage)
- [x] Autenticación email/password y Google OAuth
- [x] Sistema de roles (customer, creator, admin, agent)
- [x] CRUD de productos
- [x] Panel de creador básico
- [x] Fotos de workspace (FUNCIONA BIEN)
- [x] Internacionalización ES/EN
- [x] **Sistema de fotos de perfil** - Upload y visualización funcionando
- [x] **Bug de tildes en nombres** - RLS Policies arregladas
- [x] **Página de perfil completa** - Reestructurada desde cero
- [x] **Campo Instagram** - Agregado a DB y formulario
- [x] **Dropdowns de Guatemala** - Departamentos y municipios
- [x] **Geolocalización** - Para usuarios (no creadores)
- [x] **Moneda en Quetzales (GTQ)** - Cambiado en toda la app
- [x] **Sistema de carrito multi-creador** - Agrupación por creadores
- [x] **Página de checkout completa** - `/checkout` con formulario de entrega
- [x] **Panel de pedidos para usuarios** - `/user/orders` con políticas 48h
- [x] **Sistema de ofertas** - Página `/offers` con motivación de compra
- [x] **Funciones SQL de pedidos** - Gestión completa de estados
- [x] **Validación de transiciones** - Estados de pedidos con reglas
- [x] **Sistema de Analytics completo** - Dashboard para admin/agente
- [x] **Sistema de permisos granular** - Roles diferenciados
- [x] **Combos colaborativos** - Sistema completo entre creadores
- [x] **Tiempo de preparación** - Visible en todos los productos

---

## ✅ NUEVAS FUNCIONALIDADES COMPLETADAS (Diciembre 2024)

### 📊 Sistema de Analytics Completo
**Estado:** ✅ **COMPLETADO**  
**Descripción:** Dashboard completo para admin/agente con métricas avanzadas
- Vercel Analytics y Speed Insights integrados
- Página `/admin/analytics` con gráficos interactivos
- Tracking de eventos personalizados (productos, pedidos, creadores)
- KPIs: visitantes únicos, conversión, tiempo en sitio
- Análisis por dispositivos, fuentes de tráfico, horarios
- Métricas de rendimiento web (FCP, LCP, FID, CLS)

### 🔐 Sistema de Permisos Granular
**Estado:** ✅ **COMPLETADO**  
**Descripción:** Control de acceso diferenciado por roles
- **CREADORES:** Solo sus propios productos y pedidos
- **ADMIN/AGENTE:** Gestión completa de todos los creadores
- Navegación dinámica según permisos
- Páginas `/admin/creators` y `/admin/products`
- Hook `usePermissions()` para control granular

### 🎁 Sistema de Combos Colaborativos
**Estado:** ✅ **COMPLETADO**  
**Descripción:** Combos donde varios creadores trabajan juntos
- Base de datos completa (combos, combo_items, combo_creators)
- Página pública `/combos` con filtros avanzados
- Página detalle `/combos/[id]` con info completa
- Panel creador `/creator/combos` para gestionar colaboraciones
- Cálculo automático de ganancias por creador
- Ofertas limitadas con contador de tiempo

### ⏰ Tiempo de Preparación Visible
**Estado:** ✅ **COMPLETADO**  
**Descripción:** Tiempo de preparación mostrado en todos los productos
- ProductCard: Tiempo visible en tarjetas
- CartView: Tiempo en cada producto del carrito
- ProductTable: Nueva columna en panel creador
- Checkout: Tiempo en resumen de pedido
- Formato consistente con ícono de reloj

### 👥 Panel de Pedidos para Usuarios
**Estado:** ✅ **COMPLETADO**  
**Descripción:** Panel completo para que usuarios vean sus pedidos
- Página `/user/orders` con diseño atractivo
- Políticas de 48 horas claramente visibles
- Cancelación inteligente con validaciones
- Estados de pedidos en tiempo real
- Motivación para nuevas compras

---

## 🔴 TAREAS PENDIENTES (En orden de prioridad)

### TAREA 1: Sistema de Emails Completo
**Estado:** ✅ **COMPLETADO AL 100%**  
**Prioridad:** ALTA

**✅ COMPLETADO:**
- ✅ Edge Function desplegada en Supabase
- ✅ Sistema de emails de pedidos funcionando
- ✅ Sistema de emails de bienvenida funcionando
- ✅ Resend API configurada y funcionando
- ✅ JWT correcta configurada
- ✅ Emails automáticos al registrarse (usuario + admin)
- ✅ Emails automáticos al crear pedidos
- ✅ Logs de emails en base de datos
- ✅ Rate limiting controlado por Resend

**📧 EMAILS FUNCIONANDO:**
- **Bienvenida Cliente**: "🍰 ¡Bienvenido a TASTY!"
- **Bienvenida Creador**: "🎉 ¡Bienvenido a TASTY como Creador!"
- **Notificación Admin**: Automática para nuevos usuarios
- **Confirmación Pedidos**: Lista para usar

**⚠️ LIMITACIÓN ACTUAL:**
- Solo envía a `pepiancookingclass@gmail.com` (cuenta verificada)
- Para enviar a otros emails: verificar dominio en resend.com/domains

**Archivos finales:**
- `final-email-system-complete.sql` ✅ (sistema completo)
- `create-email-logs-table.sql` ✅ (logs)
- `supabase/functions/send-email/index.ts` ✅ (desplegado)

---

### TAREA 2: Integración WhatsApp
**Estado:** ✅ **COMPLETADO**  
**Prioridad:** MEDIA

**FLUJO IMPLEMENTADO:**
1. Cliente suma productos al carrito
2. Va a `/checkout` y completa datos de entrega
3. Al confirmar pedido:
   - Se crea en DB con número único
   - Se genera mensaje para cliente con resumen
   - Se genera URL de WhatsApp al agente (+502 30635323)
   - Cliente confirma si quiere enviar WhatsApp al agente
4. Agente recibe mensaje completo con todos los datos del pedido

**Archivos modificados:**
- `src/lib/services/orders.ts` - Funciones WhatsApp
- `src/app/checkout/page.tsx` - Integración del flujo

---

### TAREA 3: Sistema de pagos con comisión
**Estado:** ✅ **COMPLETADO**  
**Prioridad:** MEDIA

**IMPLEMENTADO:**
- Panel de creador muestra ganancias reales (90% del total)
- Dashboard actualizado con comisión Tasty (10%)
- Tabla de pedidos muestra desglose: Total / Tu parte / Comisión Tasty
- Cálculos automáticos en todas las vistas

**Archivos modificados:**
- `src/components/creator/orders/OrderTable.tsx` - Desglose de comisiones
- `src/app/creator/dashboard/page.tsx` - Estadísticas correctas

---

## 🔄 **FLUJO COMPLETO DE PEDIDOS IMPLEMENTADO**

### 📱 **FLUJO USUARIO:**
1. **Carrito:** Cliente agrega productos de múltiples creadores
2. **Checkout:** Completa datos (nombre, teléfono, dirección con dropdowns de Guatemala)
3. **Confirmación:** Se crea pedido con número único en DB
4. **WhatsApp:** Cliente recibe mensaje con resumen y opción de enviar al agente
5. **Agente:** Recibe WhatsApp completo con todos los datos (+502 30635323)

### 💰 **SISTEMA DE COMISIONES:**
- **Total del pedido:** Lo que paga el cliente
- **Creador recibe:** 90% del valor de sus productos
- **Tasty comisión:** 10% del valor total
- **Delivery:** Costo aparte (Q15 base)

### 🏪 **PANEL DE CREADOR:**
- Dashboard muestra ganancias reales (90%)
- Tabla de pedidos con desglose de comisiones
- Estadísticas actualizadas con cálculos correctos

### 📊 **BASE DE DATOS:**
- Tabla `orders` con todos los campos necesarios
- Tabla `order_items` con productos y cantidades
- Campos agregados: teléfono, email, dirección completa, método de pago

---

### TAREA 2: Formulario de Combos Colaborativos
**Estado:** ✅ **COMPLETADO**  
**Prioridad:** MEDIA

**✅ IMPLEMENTADO:**
- ✅ Página `/creator/combos/new` completa
- ✅ Búsqueda y selección de productos de cualquier creador
- ✅ Configuración automática de precios y descuentos
- ✅ Cálculo de distribución de ganancias por creador
- ✅ Preview en tiempo real del combo
- ✅ Categorías y configuración avanzada
- ✅ Base de datos completa para combos

**Archivos creados:**
- `src/app/creator/combos/new/page.tsx` ✅
- `create-combos-system.sql` ✅ (base de datos)

### TAREA 3: Calculadora de Delivery Inteligente
**Estado:** 🔴 **PENDIENTE**  
**Prioridad:** ALTA

**Descripción:** Sistema de cálculo de delivery por distancia/zona
- Integración con geolocalización del checkout
- Cálculo automático basado en distancia
- Tarifas por zonas de Guatemala
- Estimación de tiempo de entrega
- Configuración de zonas de cobertura

**Tecnología sugerida:** Leaflet.js + OpenStreetMap (ya integrado)

### TAREA 4: Sistema de Notificaciones
**Estado:** PENDIENTE  
**Prioridad:** MEDIA

**Descripción:** Notificaciones en tiempo real
- Notificaciones push para cambios de estado
- Notificaciones por email para eventos importantes
- Panel de notificaciones en la app
- Configuración de preferencias de notificación

### TAREA 5: Mejorar Sistema de Búsqueda
**Estado:** PENDIENTE  
**Prioridad:** BAJA

**Descripción:** Búsqueda avanzada de productos y combos
- Búsqueda por ingredientes
- Filtros avanzados (precio, tiempo, ubicación)
- Búsqueda por creador
- Sugerencias de búsqueda
- Historial de búsquedas

**Servicio sugerido:** Resend (fácil de integrar)

**Emails a enviar:**
| Evento | Destinatario | Template |
|--------|--------------|----------|
| Registro | Usuario + Admin | Bienvenida |
| Compra | Usuario + Admin + Creador | Confirmación |
| Estado pedido | Usuario | Actualización |

---

### TAREA 9: Geolocalización
**Estado:** PENDIENTE  
**Prioridad:** BAJA

**Hook básico:**
```typescript
// src/hooks/useGeolocation.ts
export function useGeolocation() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err)
    );
  };
  
  return { location, getLocation };
}
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: users
```
id UUID PRIMARY KEY
email VARCHAR
name VARCHAR
phone VARCHAR
profile_picture_url TEXT
roles TEXT[] -- ['customer', 'creator', 'admin', 'agent']
skills TEXT[] -- ['pastry', 'savory', 'handmade']
gender VARCHAR
workspace_photos TEXT[]
address_street, address_city, address_state, address_zip, address_country VARCHAR
has_delivery BOOLEAN
created_at, updated_at TIMESTAMP
```

### Tabla: products
```
id UUID PRIMARY KEY
creator_id UUID REFERENCES users(id)
name, description, image_url, category VARCHAR/TEXT
price DECIMAL
is_available BOOLEAN
created_at, updated_at TIMESTAMP
```

### Tabla: orders
```
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
status VARCHAR -- 'pending', 'confirmed', 'preparing', 'ready', 'delivered'
total DECIMAL
created_at, updated_at TIMESTAMP
```

### Tabla: order_items
```
id UUID PRIMARY KEY
order_id UUID REFERENCES orders(id)
product_id UUID REFERENCES products(id)
quantity INTEGER
price_at_purchase DECIMAL
```

---

## 📁 ARCHIVOS CLAVE

| Archivo | Descripción |
|---------|-------------|
| `src/app/user/profile/page.tsx` | Perfil de usuario, fotos, skills |
| `src/app/page.tsx` | Home con productos y creadores |
| `src/app/creator/products/page.tsx` | Panel de productos del creador |
| `src/components/ui/multi-image-upload.tsx` | Upload múltiple (FUNCIONA) |
| `src/hooks/useUser.ts` | Hook del usuario actual |
| `src/lib/supabase.ts` | Cliente Supabase |
| `src/providers/auth-provider.tsx` | Contexto de autenticación |

---

## 🔧 CONFIGURACIÓN

### Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://aitmxnfljglwpkpibgek.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Supabase Storage
- Bucket `images` - PÚBLICO
- Bucket `avatars` - PÚBLICO

### Comandos
```bash
npm run dev    # Desarrollo
npm run build  # Build producción
```

---

## 📝 HISTORIAL DE CAMBIOS

| Fecha | Cambio |
|-------|--------|
| 19/12/24 | Migración Firebase → Supabase completada |
| 19/12/24 | Sistema de fotos de workspace funcionando |
| 19/12/24 | Fotos de perfil con problemas (404) |
| 19/12/24 | Creado este documento de estado |
| 19/12/24 | ✅ Build exitoso - proyecto compila sin errores |
| 19/12/24 | 🔍 **DEBUGGING COMPLETO** - Problemas identificados |
| 19/12/24 | ✅ Storage funciona correctamente - NO es el problema |
| 19/12/24 | ✅ Agregados logs detallados para upload y guardado |
| 19/12/24 | 🔴 **CAUSA IDENTIFICADA**: RLS Policies bloqueando operaciones |
| 19/12/24 | 📄 Creado `fix-rls-policies.sql` para solucionar |
| 19/12/24 | ✅ **FLUJO COMPLETO DE PEDIDOS** - WhatsApp + Comisiones |
| 19/12/24 | ✅ Instagram solo para creadores, imágenes sin distorsión |
| 19/12/24 | ✅ Moneda cambiada a Quetzales (GTQ) en toda la app |
| 19/12/24 | ✅ Dropdowns Guatemala/Sacatepéquez con municipios |
| 19/12/24 | ✅ Geolocalización para usuarios (no creadores) |
| 19/12/24 | ✅ Página de checkout completa con WhatsApp al agente |

---

## 🚀 PARA EMPEZAR

```bash
# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor de desarrollo
npm run dev

# El proyecto corre en http://localhost:3000
```

### Primera tarea para el próximo agente:
1. Iniciar el servidor con `npm run dev`
2. Ir a http://localhost:3000/user/profile
3. Escribir un nombre con tilde (ej: "María")
4. Guardar y ver qué error aparece
5. Reportar el error exacto para solucionarlo

---

## ⚠️ PROBLEMAS CONOCIDOS

1. **Fotos de perfil:** Dan 404, pero workspace funciona. Mismo código, diferente carpeta.
2. **Tildes:** Usuario reporta que no guarda nombres con tildes. Necesita debugging.
3. **Imágenes grandes:** CSS necesita ajuste de tamaños.

---

*Actualizar este documento después de cada tarea completada.*
