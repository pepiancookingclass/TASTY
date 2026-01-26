# 📧 CONFIGURACIÓN DE EMAILS PARA TASTY

## 🚀 PASOS PARA IMPLEMENTAR

### 1️⃣ **EJECUTAR FUNCIONES SQL EN SUPABASE**

1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar el archivo `create-email-functions.sql` completo
3. Verificar que las funciones se crearon correctamente

### 2️⃣ **CREAR CUENTA EN RESEND**

1. Ir a [resend.com](https://resend.com)
2. Crear cuenta gratuita (40,000 emails/mes gratis)
3. Verificar dominio (opcional, se puede usar con subdominio de Resend)
4. Obtener API Key

### 3️⃣ **DESPLEGAR EDGE FUNCTION**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar (si no está hecho)
supabase init

# Crear función
supabase functions new send-email

# Copiar el código de supabase-edge-function-send-email.ts
# a supabase/functions/send-email/index.ts

# Desplegar
supabase functions deploy send-email --project-ref aitmxnfljglwpkpibgek
```

### 4️⃣ **CONFIGURAR VARIABLES DE ENTORNO**

En Supabase Dashboard → Settings → Edge Functions:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
```

O por CLI:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx --project-ref aitmxnfljglwpkpibgek
```

### 5️⃣ **CONFIGURAR EMAILS**

Editar en `create-email-functions.sql`:

```sql
-- Cambiar email del administrador
admin_email TEXT := 'admin@tasty.com'; -- ← CAMBIAR AQUÍ

-- Cambiar dominio en Edge Function
FROM_EMAIL = 'TASTY <noreply@tasty.com>' -- ← CAMBIAR AQUÍ
```

## 📧 **EMAILS QUE SE ENVÍAN**

### ✅ **AL CLIENTE**
- **Cuándo:** Inmediatamente al crear pedido
- **Contenido:** Confirmación con resumen completo
- **Asunto:** "🍳 Confirmación de Pedido TASTY #ABC12345"

### ✅ **AL ADMINISTRADOR**
- **Cuándo:** Inmediatamente al crear pedido  
- **Contenido:** Notificación de nuevo pedido con todos los detalles
- **Asunto:** "🚨 NUEVO PEDIDO TASTY #ABC12345"

### ✅ **A CADA CREADOR**
- **Cuándo:** Inmediatamente al crear pedido
- **Contenido:** Solo sus productos + cálculo de ganancias (90%)
- **Asunto:** "🍳 Nuevo Pedido para [Nombre] #ABC12345"

## 🔄 **FLUJO AUTOMÁTICO**

1. Cliente confirma pedido en `/checkout`
2. Se crea registro en tabla `orders`
3. **TRIGGER automático** ejecuta `process_order_emails()`
4. Se envían 3 emails simultáneamente:
   - Cliente → Confirmación
   - Admin → Notificación  
   - Creador(es) → Sus productos + ganancias

## 🧪 **TESTING**

### Probar emails manualmente:
```sql
-- En Supabase SQL Editor
SELECT process_order_emails('uuid-del-pedido-aqui');
```

### Verificar logs:
- Supabase Dashboard → Edge Functions → send-email → Logs
- Ver si hay errores en el envío

## 🔧 **TROUBLESHOOTING**

### ❌ **Error: "Email service not configured"**
- Verificar que `RESEND_API_KEY` esté configurada
- Verificar que la Edge Function esté desplegada

### ❌ **Error: "Function not found"**
- Re-desplegar la Edge Function
- Verificar el nombre exacto: `send-email`

### ❌ **Emails no llegan**
- Verificar spam/junk folder
- Verificar API key de Resend
- Revisar logs de Edge Function

### ❌ **Error en SQL Functions**
- Verificar que las tablas `orders`, `order_items`, `products`, `users` existan
- Verificar que los campos coincidan con el schema

## 📊 **MONITOREO**

- **Resend Dashboard:** Ver estadísticas de emails enviados
- **Supabase Logs:** Ver errores de Edge Functions
- **SQL Logs:** Ver ejecución de triggers

## 🎯 **PRÓXIMOS PASOS**

1. ✅ Ejecutar SQL functions
2. ✅ Configurar Resend + Edge Function  
3. 🔄 Probar con pedido real
4. 📧 Personalizar templates de email
5. 📊 Agregar tracking de emails abiertos (opcional)





