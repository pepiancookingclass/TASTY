# 📧 DESPLEGAR FUNCIÓN DE EMAIL A SUPABASE

## 🚀 Pasos para Desplegar

### 1. Instalar Supabase CLI
```bash
npm install -g supabase
```

### 2. Login a Supabase
```bash
supabase login
```

### 3. Crear estructura de carpetas
```bash
mkdir -p supabase/functions/send-email
```

### 4. Copiar el archivo de función
Copiar el contenido de `supabase-edge-function-send-email.ts` a:
```
supabase/functions/send-email/index.ts
```

### 5. Desplegar la función
```bash
supabase functions deploy send-email --project-ref aitmxnfljglwpkpibgek
```

### 6. Configurar variables de entorno
```bash
# En el dashboard de Supabase > Settings > Edge Functions
RESEND_API_KEY=tu_api_key_de_resend
```

## 📝 Contenido del Email

### ✅ Email de Confirmación al Cliente
```
🎉 ¡Pedido Confirmado! - TASTY

Hola [NOMBRE],

¡Tu pedido ha sido confirmado exitosamente!

📋 DETALLES DEL PEDIDO:
• Número: #[NUMERO]
• Total: Q[TOTAL]
• Entrega: [FECHA] en [DIRECCION]

🛍️ PRODUCTOS:
[LISTA_PRODUCTOS]

📱 PRÓXIMOS PASOS:
1. Recibirás WhatsApp de confirmación
2. Los creadores prepararán tu pedido
3. Te notificaremos cuando esté listo

¡Gracias por elegir TASTY! 🍰

Ver Ofertas: https://tasty.com/offers
Mis Pedidos: https://tasty.com/user/orders
```

### ✅ Email al Administrador
```
🔔 Nuevo Pedido - TASTY Admin

PEDIDO: #[NUMERO]
CLIENTE: [NOMBRE] - [EMAIL]
TOTAL: Q[TOTAL]
ENTREGA: [FECHA] en [DIRECCION]

PRODUCTOS:
[LISTA_PRODUCTOS]

CREADORES INVOLUCRADOS:
[LISTA_CREADORES]

Panel Admin: https://tasty.com/admin
```

### ✅ Email al Creador
```
🎯 Nuevo Pedido para Ti - TASTY

Hola [CREADOR],

¡Tienes un nuevo pedido!

PEDIDO: #[NUMERO]
CLIENTE: [NOMBRE]
TUS PRODUCTOS: [PRODUCTOS]
TU GANANCIA: Q[GANANCIA] (90%)

ENTREGA: [FECHA]
DIRECCIÓN: [DIRECCION]

PRÓXIMOS PASOS:
1. Prepara los productos
2. Actualiza el estado en tu panel
3. Recibirás el pago después de la entrega

Panel Creador: https://tasty.com/creator
WhatsApp Soporte: +502 30635323
```

## 🔧 Configuración Adicional

### Cambiar Email de Origen
En `supabase-edge-function-send-email.ts` línea 9:
```typescript
const FROM_EMAIL = 'TASTY <noreply@tudominio.com>'
```

### Cambiar Email del Admin
En `create-email-functions.sql` línea 120:
```sql
admin_email := 'admin@tudominio.com';
```

## ✅ Verificar Deployment
```bash
# Ver logs de la función
supabase functions logs send-email --project-ref aitmxnfljglwpkpibgek

# Probar la función
curl -X POST https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@email.com","subject":"Test","html":"<h1>Test</h1>"}'
```




