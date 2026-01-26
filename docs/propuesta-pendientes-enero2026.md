# Propuesta de solución pendientes (WhatsApp, Emails, Validación geoloc/dirección)

## 1) WhatsApp: teléfono e IVA siempre presentes (intentado y revertido)
- **Contexto completo:** Se añadieron logs y fallback parcial en `orders.ts`, pero se revirtió porque el checkout se rompió. La versión actual es estable (sin esos cambios). El mensaje de WhatsApp sigue sin teléfono si el perfil viene vacío.
- **Problema:** Si el perfil no tiene teléfono, el mensaje muestra “No proporcionado”. El IVA sí está en la plantilla, pero requiere rebuild para verse.
- **Acción propuesta (re-aplicar con cuidado):** En `src/lib/services/orders.ts`, dentro de `createOrder`, definir antes del payload:
  ```ts
  const phone = deliveryData.phone || user?.phone || authUser?.user_metadata?.phone || '';
  ```
  Usar `phone` al guardar `customer_phone` y al llamar `generateCustomerWhatsAppUrl`.
- **Logs sugeridos:** Antes de generar la URL, log de `{ subtotal, ivaAmount, deliveryFee, total, phone, items }` y preview de mensaje (los logs previos se revertieron; reactivarlos si se limpia).
- **Prueba:** Checkout con teléfono en formulario; mensaje debe mostrar IVA y el número.

## 2) Emails cliente/admin: incluir productos y delivery (no aplicado; se dejó versión estable)
- **Contexto completo:** Se cambió el destinatario (cliente/creador) pero se revirtió todo para volver a la versión estable. El problema original persiste: cliente y admin reciben correos sin productos ni desglose de delivery; solo el creador ve el desglose.
- **Problema:** Cliente y admin no ven lista de productos ni delivery.
- **Acción concreta en `supabase/functions/send-email/index.ts`:**
  - Destinatarios: cliente → `order.customer_email`, creador → email del creador; admin puede seguir en `ADMIN_EMAIL`.
  - Plantilla cliente: insertar `productsListHtml` y desglose global (subtotal, IVA, delivery, total ya existen). Asegurar que se vea la lista.
  - Plantilla admin: incluir `creator.items` por creador con cantidades/precios, y delivery por creador usando `delivery_breakdown` (si no hay, dividir equitativamente como ya se hace). Mostrar totales y delivery.
  - No tocar lógica de fetch Resend ni consultas; solo HTML y destinatarios.
- **Prueba:** Pedido de 1 y múltiples creadores; revisar correos de cliente y admin y confirmar que muestran productos y delivery (como el correo de creador ya lo hace).

## 3) Validación dirección vs geoloc (seguridad antifraude)
- **Plan existente:** `docs/plan-validacion-direcciones.md` (Nominatim + Haversine, umbral 500 m).
- **Implementación sugerida:**
  - Crear helper `validateAddressDistance(address, finalLocation)` (fetch a Nominatim, cache, Haversine).
  - Disparar validación al guardar dirección o antes del submit, no en useEffect.
  - Si distancia > 0.5 km: mostrar advertencia/bloquear; si Nominatim falla, permitir continuar con aviso.
- **Prueba:** Caso OK (<500 m), caso advertencia (>500 m), sin resultados Nominatim, error de red.

## Secuencia recomendada
1. Aplicar fallback de teléfono en `orders.ts` y logs, rebuild y probar WhatsApp (sin romper checkout).
2. Ajustar plantilla de emails cliente/admin en `send-email/index.ts`, redeploy edge function, probar pedido (cliente/admin/creador).
3. Implementar validación Nominatim según el plan y probar 4 casos.

## Notas
- Se revirtió a la versión estable tras romper checkout/WhatsApp; re-aplicar cambios con cuidado.
- Edge function actual (main) está en estado estable tras revert; cambios en emails deberán redeployarse en Supabase.
- Para no ensuciar `main`, hacer rama de trabajo y PR/cherry-pick.

