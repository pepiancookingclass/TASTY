## Resumen de lo realizado
- Se integró validación de coherencia dirección vs geolocalización en el checkout (`src/app/checkout/page.tsx`), usando Nominatim + Haversine (helper `src/lib/validate-address-distance.ts`).
- Se cambió el aviso a un toast con enlace a WhatsApp (+502 30635323) y se bloquea el botón de compra cuando la validación falla (`state === 'blocked'`). Al cambiar dirección o ubicación se limpia el bloqueo para revalidar.
- Se agregó botón “Cambiar ubicación” en el bloque de ubicación confirmada (abre el selector de mapa) con estilo de tema.
- El toast ahora muestra la distancia si está disponible y el link de WhatsApp en verde para visibilidad sobre fondo rojo.

## Problema inicial observado (ya instrumentado)
- Con la dirección “21 avenida, Vista Hermosa 1, 2-04, zona 15, Guatemala” no salía el log de distancia; no se sabía si Nominatim devolvía coords o no. Se añadieron logs completos (HTTP, sin resultados, catch, distancia) en `validate-address-distance.ts`.

## Observación sobre el aviso de WhatsApp
- El toast rojo incluye el link a WhatsApp en verde (texto “WhatsApp”). Si se prefiere, se puede mover el link al texto: “Contactar por WhatsApp: +502 30635323”.
- Mensaje prellenado sugerido (minúsculas) al abrir WhatsApp, con nombre del usuario:
  - ES: `hola, soy {nombre}. estoy teniendo problemas con validar mi direccion de entrega, me puedes ayudar?`
  - EN: `hi, i'm {name}. i'm having trouble validating my delivery address, can you help me?`
  - Armar la URL: `https://wa.me/50230635323?text=${encodeURIComponent(mensaje)}` eligiendo idioma según `useLanguage`.

## Archivo ajustados en esta iteración
- `src/app/checkout/page.tsx`: toast con distancia y link verde, botón “Cambiar ubicación” con estilo de tema.
- `src/lib/validate-address-distance.ts`: log inicial de query/ubicación (falta log de distancia por completarse en ejecución).

## Estado actual y pruebas realizadas
- Implementado en `validate-address-distance.ts`:
  - Intento principal con calle completa, limitado por `viewbox` cercano y hasta 5 resultados.
  - Intento intermedio si la calle contiene “zona X”: consulta `zona + municipio + departamento + Guatemala`.
  - Fallback: `municipio + departamento + Guatemala` (sin calle).
  - Se elige siempre el resultado más cercano al pin. Si la distancia ≤0.5 km: ok. Si >0.5 km y ≤3 km: ok con “validación aproximada”. Si >3 km: se bloquea.
- Pruebas:
  - Zona 15 (Guatemala): match con “zona 15”, distancia ~0.47 km → OK sin aproximado.
  - Zona 11 (Mariscal): match con “zona 11”, distancia ~1.0 km → OK con “validación aproximada (≤3 km)”.
  - Antigua Guatemala (sin zona): fallback municipio/depto, distancia ~2.98 km → OK con “validación aproximada (≤3 km)”.
- Mensaje de “entrega no disponible” ahora incluye WhatsApp soporte `https://wa.me/50230635323`.

## Próximos pasos
- Mantener umbral de aproximado en 3 km; si se observan falsos positivos, bajarlo (ej. 2 km) o ajustar viewbox.
- Probar direcciones sin zona en otros municipios/departamentos para confirmar que el fallback queda ≤3 km; si no, considerar intento intermedio con colonia/barrio si se detecta.
- Bilingüalización pendiente: mover estos mensajes a diccionarios ES/EN.

---

## Bitácora de cambios (última iteración)
- Añadidos logs completos (HTTP, sin resultados, catch, distancia) y selección por cercanía.
- Intento intermedio por “zona X”; fallback municipio+depto.
- Umbral aproximado fijado en 3 km con warning.
- Probado con zona 15, zona 11 y Antigua (ver arriba).

