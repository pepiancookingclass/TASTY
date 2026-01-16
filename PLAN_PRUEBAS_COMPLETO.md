# 🧪 PLAN DE PRUEBAS COMPLETO - TASTY

> **Objetivo:** Probar exhaustivamente todas las funcionalidades de TASTY antes del lanzamiento  
> **Estado del proyecto:** 100% construido, necesita validación completa  
> **Fecha:** Diciembre 2024

---

## 🎯 METODOLOGÍA DE PRUEBAS

### **TIPOS DE PRUEBAS:**
- ✅ **Funcionales** - Cada característica funciona como se espera
- ✅ **Integración** - Los sistemas trabajan juntos correctamente  
- ✅ **Usuario final** - Experiencia completa del usuario
- ✅ **Roles y permisos** - Cada rol ve y puede hacer solo lo correcto
- ✅ **Edge cases** - Situaciones límite y errores

### **CRITERIOS DE ÉXITO:**
- ✅ Flujo completo sin errores críticos
- ✅ Emails se envían correctamente
- ✅ Cálculos de precios y delivery correctos
- ✅ Permisos funcionan según el rol
- ✅ Datos se guardan y recuperan correctamente

---

## 📋 FASE 1: AUTENTICACIÓN Y PERFILES

### **1.1 REGISTRO Y LOGIN**
- [ ] **Registro nuevo usuario** (email/password)
  - Formulario completo
  - Validaciones de campos
  - Email de verificación enviado
  - Redirección correcta tras registro
  
- [ ] **Login con Google OAuth**
  - Botón funcional
  - Permisos correctos
  - Creación automática de perfil
  
- [ ] **Verificación de email**
  - Link funcional en email
  - Cuenta activada correctamente
  - Redirección a dashboard
  
- [ ] **Recuperación de contraseña**
  - Formulario "Forgot password"
  - Email de reset enviado
  - Link funcional para cambiar contraseña
  - Nueva contraseña funciona

### **1.2 PERFIL DE CLIENTE**
- [ ] **Completar perfil básico**
  - Nombre, teléfono, foto
  - Dirección de entrega
  - Geolocalización funcional
  - Dropdowns Guatemala (departamentos/municipios)
  
- [ ] **Editar perfil existente**
  - Cambios se guardan
  - Foto se actualiza
  - Validaciones funcionan

### **1.3 SISTEMA DE PRE-APROBACIÓN CREADORES**
- [ ] **Opción "¿Quieres vender en TASTY?"**
  - Visible en menú/dashboard de usuario
  - Acceso al formulario de creador
  - Mensaje claro sobre pre-evaluación
  
- [ ] **Formulario de creador (pre-aprobación)**
  - Todos los campos del formulario actual
  - 3 fotos de productos obligatorias
  - Instagram y descripción de motivación
  - Estado "pendiente de aprobación"
  
- [ ] **Email de notificación admin**
  - Se envía cuando alguien completa perfil creador
  - Incluye todos los datos del solicitante
  - Link para revisar y aprobar
  
- [ ] **Sistema de aprobación**
  - Admin puede ver solicitudes pendientes
  - Botón aprobar/rechazar
  - Email de confirmación al solicitante
  - Activación del perfil de creador

---

## 📋 FASE 2: PRODUCTOS Y GESTIÓN

### **2.1 CREACIÓN DE PRODUCTOS (CREADOR)**
- [ ] **Agregar nuevo producto**
  - Formulario completo
  - Subida de fotos múltiples
  - Precios y descripciones
  - Tiempo de preparación
  - Categorías y etiquetas dietéticas
  
- [ ] **Visualización de productos**
  - Fotos se ven completas (object-fit: contain)
  - Aspect ratio square funciona
  - Información completa visible
  - Precios en Quetzales (GTQ)
  
- [ ] **Editar productos existentes**
  - Cambios se guardan correctamente
  - Fotos se actualizan
  - Productos activos/inactivos

### **2.2 COMBOS COLABORATIVOS**
- [ ] **Crear combo nuevo**
  - Seleccionar productos de diferentes creadores
  - Configurar precios y descuentos
  - Distribución de comisiones 90/10
  - Descripción y foto del combo
  
- [ ] **Página pública /combos**
  - Lista todos los combos activos
  - Información completa visible
  - Botón "Agregar al carrito" funcional
  
- [ ] **Gestión de combos (creador)**
  - Ver combos donde participa
  - Estadísticas de ventas
  - Ganancias por combo

---

## 📋 FASE 3: SISTEMA DE COMPRAS

### **3.1 CARRITO DE COMPRAS**
- [ ] **Agregar productos al carrito**
  - Desde página de producto
  - Desde página de creador
  - Desde combos
  - Cantidades modificables
  
- [ ] **Carrito multi-creador**
  - Productos de diferentes creadores
  - Separación por creador visible
  - Cálculo de delivery por creador
  - Subtotales correctos
  
- [ ] **Modificar carrito**
  - Cambiar cantidades
  - Eliminar productos
  - Vaciar carrito
  - Persistencia entre sesiones

### **3.2 PROCESO DE CHECKOUT**
- [ ] **Formulario de entrega**
  - Datos del cliente pre-llenados
  - Dirección de entrega editable
  - Teléfono de contacto
  - Notas especiales
  
- [ ] **Geolocalización y mapa**
  - Mapa interactivo (Leaflet.js)
  - Selección de ubicación precisa
  - Cálculo automático de distancia
  - Tarifas de delivery por creador
  
- [ ] **Resumen de pedido**
  - Productos agrupados por creador
  - Precios individuales correctos
  - Delivery por creador
  - Comisión TASTY 10%
  - Total general correcto
  
- [ ] **Métodos de pago**
  - Efectivo contra entrega
  - Transferencia bancaria
  - Instrucciones claras
  
- [ ] **Confirmación de pedido**
  - Número de orden generado
  - Tiempo estimado de preparación
  - Información de contacto del creador

---

## 📋 FASE 4: SISTEMA DE DELIVERY

### **4.1 CONFIGURACIÓN DE CREADORES**
- [ ] **Ubicación del creador**
  - Dirección de workspace
  - Geolocalización precisa
  - Tarifas de delivery configurables
  - Radio de entrega
  
- [ ] **Cálculo dinámico de delivery**
  - Distancia real calculada
  - Tarifas aplicadas correctamente
  - Múltiples creadores en un pedido
  - Optimización de rutas

### **4.2 GESTIÓN DE ENTREGAS**
- [ ] **Estados de pedido**
  - Pendiente → Confirmado → Preparando → Listo → Entregado
  - Transiciones automáticas
  - Notificaciones por estado
  
- [ ] **Tracking de pedidos**
  - Cliente ve estado actual
  - Tiempo estimado actualizado
  - Información de contacto disponible

---

## 📋 FASE 5: SISTEMA DE EMAILS

### **5.1 EMAILS DE BIENVENIDA**
- [ ] **Email cliente nuevo**
  - Template correcto
  - Información personalizada
  - Links funcionales
  - Diseño responsive
  
- [ ] **Email creador nuevo**
  - Bienvenida específica para creadores
  - Guía de primeros pasos
  - Links a panel de creador
  
- [ ] **Email pre-aprobación creador**
  - Confirmación de solicitud recibida
  - Tiempos de respuesta esperados
  - Siguiente pasos

### **5.2 EMAILS DE PEDIDOS**
- [ ] **Email confirmación cliente**
  - Detalles completos del pedido
  - Número de orden
  - Información de contacto creadores
  - Tiempo estimado
  
- [ ] **Email notificación creador**
  - Nuevo pedido recibido
  - Detalles de productos
  - Información del cliente
  - Instrucciones de preparación
  
- [ ] **Email notificación admin**
  - Resumen del pedido
  - Comisiones calculadas
  - Datos para seguimiento

### **5.3 CONFIGURACIÓN DE EMAILS**
- [ ] **Edge Functions funcionando**
  - Triggers automáticos activos
  - Logs de envío correctos
  - Manejo de errores
  
- [ ] **Dominio de email**
  - Cambiar de onboarding@resend.dev
  - Configurar dominio propio
  - Verificación SPF/DKIM

---

## 📋 FASE 6: ROLES Y PERMISOS

### **6.1 PANEL DE CLIENTE**
- [ ] **Dashboard personal**
  - Pedidos actuales y histórico
  - Estado de pedidos en tiempo real
  - Perfil editable
  - Configuración de privacidad
  
- [ ] **Historial de pedidos**
  - Lista completa de pedidos
  - Detalles expandibles
  - Opción de reordenar
  - Calificaciones y reseñas

### **6.2 PANEL DE CREADOR**
- [ ] **Dashboard de ventas**
  - Pedidos pendientes
  - Productos más vendidos
  - Ganancias del día/semana/mes
  - Comisiones detalladas
  
- [ ] **Gestión de productos**
  - Lista de productos activos/inactivos
  - Estadísticas de visualizaciones
  - Edición rápida de precios
  - Gestión de inventario
  
- [ ] **Combos colaborativos**
  - Combos donde participa
  - Crear nuevos combos
  - Invitar otros creadores
  - Estadísticas de combos

### **6.3 PANEL DE ADMIN**
- [ ] **Dashboard general**
  - Métricas de la plataforma
  - Gráficos de ventas
  - Usuarios activos
  - Creadores activos
  
- [ ] **Gestión de usuarios**
  - Lista de todos los usuarios
  - Cambiar roles
  - Suspender/activar cuentas
  - Solicitudes de creadores pendientes
  
- [ ] **Gestión de productos**
  - Revisar productos reportados
  - Aprobar/rechazar productos
  - Categorías y etiquetas
  
- [ ] **Reportes financieros**
  - Comisiones por creador
  - Ingresos totales
  - Estadísticas de delivery
  - Exportar reportes

### **6.4 PANEL DE AGENTE**
- [ ] **Soporte al cliente**
  - Ver pedidos de clientes
  - Historial de interacciones
  - Resolver problemas básicos
  - Escalación a admin

---

## 📋 FASE 7: FUNCIONALIDADES ESPECIALES

### **7.1 SISTEMA DE PRIVACIDAD**
- [ ] **Control de datos personales**
  - Opción "Eliminar mis datos tras entrega"
  - Geolocalización solo en checkout
  - Configuración granular de privacidad
  
- [ ] **Eliminación automática**
  - Datos eliminados tras entrega confirmada
  - Logs de eliminación
  - Conservación de datos necesarios (facturación)

### **7.2 PROMOCIONES Y OFERTAS**
- [ ] **Página de ofertas**
  - Lista de promociones activas
  - Filtros por categoría
  - Fechas de validez claras
  
- [ ] **Sistema de descuentos**
  - Códigos promocionales
  - Descuentos automáticos
  - Ofertas por primera compra
  - Combos con descuento

### **7.3 BÚSQUEDA Y FILTROS**
- [ ] **Búsqueda de productos**
  - Por nombre y descripción
  - Filtros por categoría
  - Filtros dietéticos
  - Ordenamiento por precio/popularidad
  
- [ ] **Búsqueda de creadores**
  - Por nombre y ubicación
  - Filtros por especialidad
  - Calificaciones y reseñas

---

## 📋 FASE 8: EXPERIENCIA DE USUARIO

### **8.1 NAVEGACIÓN Y DISEÑO**
- [ ] **Responsive design**
  - Mobile completamente funcional
  - Tablet optimizado
  - Desktop fluido
  
- [ ] **Velocidad de carga**
  - Imágenes optimizadas
  - Lazy loading funcionando
  - Tiempos de respuesta aceptables
  
- [ ] **Navegación intuitiva**
  - Menús claros
  - Breadcrumbs funcionales
  - Botones de regreso
  - Enlaces internos correctos

### **8.2 FEEDBACK VISUAL**
- [ ] **Loading states**
  - Spinners en operaciones largas
  - Skeleton screens
  - Progress bars donde aplique
  
- [ ] **Mensajes de confirmación**
  - Éxito en operaciones
  - Errores claros y útiles
  - Warnings apropiados
  
- [ ] **Animaciones y transiciones**
  - Smooth y no distractivas
  - Hover effects funcionales
  - Micro-interacciones pulidas

### **8.3 STICKER DE AYUDA**
- [ ] **Sticker flotante**
  - Posición fija izquierda abajo
  - Diseño acorde a TASTY
  - Visible en todas las páginas
  
- [ ] **Ventana expandible**
  - Click abre ventana hacia arriba
  - "Do you have questions?"
  - "Our support team is here to help you"
  - Botón verde "Chat on WhatsApp"
  - Enlace a +50230635323

---

## 📋 FASE 9: ANALYTICS Y TRACKING

### **9.1 VERCEL ANALYTICS**
- [ ] **Configuración en producción**
  - Analytics funcionando
  - Eventos personalizados
  - Métricas de rendimiento
  
- [ ] **Dashboard de analytics**
  - Páginas más visitadas
  - Conversiones de venta
  - Embudo de compra
  - Retención de usuarios

### **9.2 TRACKING DE EVENTOS**
- [ ] **Eventos de negocio**
  - Registro de usuario
  - Creación de producto
  - Agregado al carrito
  - Compra completada
  
- [ ] **Eventos de UX**
  - Clicks en botones importantes
  - Tiempo en páginas clave
  - Abandono de carrito
  - Errores de usuario

---

## 📋 FASE 10: DEPLOYMENT Y PRODUCCIÓN

### **10.1 CONFIGURACIÓN DE PRODUCCIÓN**
- [ ] **Variables de entorno**
  - Todas las keys configuradas
  - URLs de producción correctas
  - Configuración de Supabase
  - Keys de terceros (Resend, etc.)
  
- [ ] **Build y deploy**
  - Build sin errores ni warnings
  - Deploy automático desde GitHub
  - Rollback funcional si es necesario

### **10.2 DOMINIO Y SEGURIDAD**
- [ ] **Dominio personalizado**
  - tasty.gt configurado
  - SSL certificado válido
  - Redirecciones correctas
  
- [ ] **Seguridad**
  - Headers de seguridad
  - CORS configurado
  - Rate limiting si es necesario
  - Validación de inputs

---

## 📋 FASE 11: TESTING DE CARGA Y PERFORMANCE

### **11.1 DATOS DE PRUEBA**
- [ ] **Crear datos realistas**
  - 50+ usuarios de prueba
  - 20+ creadores activos
  - 200+ productos variados
  - 100+ pedidos históricos
  
- [ ] **Escenarios de carga**
  - Múltiples usuarios simultáneos
  - Carrito con muchos productos
  - Checkout con cálculos complejos
  - Búsquedas intensivas

### **11.2 EDGE CASES**
- [ ] **Situaciones límite**
  - Carrito vacío en checkout
  - Productos sin stock
  - Creadores inactivos
  - Direcciones fuera de rango
  
- [ ] **Manejo de errores**
  - Conexión perdida
  - Pagos fallidos
  - Emails no enviados
  - Geolocalización negada

---

## 🎯 PLAN DE EJECUCIÓN SUGERIDO

### **SEMANA 1: FUNDAMENTOS**
- Días 1-2: Fase 1 (Autenticación y perfiles)
- Días 3-4: Fase 2 (Productos y gestión)
- Días 5-7: Fase 3 (Sistema de compras)

### **SEMANA 2: OPERACIONES**
- Días 1-2: Fase 4 (Sistema de delivery)
- Días 3-4: Fase 5 (Sistema de emails)
- Días 5-7: Fase 6 (Roles y permisos)

### **SEMANA 3: EXPERIENCIA**
- Días 1-2: Fase 7 (Funcionalidades especiales)
- Días 3-4: Fase 8 (Experiencia de usuario)
- Días 5-7: Fase 9 (Analytics y tracking)

### **SEMANA 4: PRODUCCIÓN**
- Días 1-3: Fase 10 (Deployment y producción)
- Días 4-5: Fase 11 (Testing de carga)
- Días 6-7: Correcciones finales y documentación

---

## 📊 MÉTRICAS DE ÉXITO

### **FUNCIONALIDAD:**
- ✅ 100% de flujos críticos funcionando
- ✅ 0 errores críticos en producción
- ✅ Todos los emails enviándose correctamente
- ✅ Cálculos financieros precisos

### **EXPERIENCIA:**
- ✅ Tiempo de carga < 3 segundos
- ✅ Mobile completamente funcional
- ✅ Navegación intuitiva sin confusión
- ✅ Mensajes de error claros

### **NEGOCIO:**
- ✅ Flujo completo de compra sin fricción
- ✅ Sistema de comisiones funcionando
- ✅ Creadores pueden gestionar su negocio
- ✅ Admins tienen control total

---

## 🚨 CRITERIOS DE PARADA

### **ERRORES CRÍTICOS:**
- Sistema de pagos no funciona
- Emails no se envían
- Datos de usuarios se pierden
- Cálculos financieros incorrectos

### **ERRORES MENORES ACEPTABLES:**
- Vercel Analytics 404 en desarrollo
- Placeholder images
- Warnings menores en consola
- Pequeños ajustes de diseño

---

## 📝 DOCUMENTACIÓN DE RESULTADOS

Para cada fase completada, documentar:
- ✅ **Funcionalidades probadas**
- ❌ **Errores encontrados**
- 🔧 **Fixes aplicados**
- 📋 **Pendientes para siguiente iteración**

---

## 🎉 CONCLUSIÓN

**Este plan cubre exhaustivamente todas las funcionalidades de TASTY.**

**Objetivo:** Validar que el sistema construido funciona perfectamente antes del lanzamiento.

**Resultado esperado:** TASTY 100% probado y listo para usuarios reales.

---

> **Próximo paso:** Ejecutar plan fase por fase  
> **Recomendación:** Empezar con Fase 1 y avanzar secuencialmente  
> **Importante:** Documentar todo y corregir errores antes de avanzar



