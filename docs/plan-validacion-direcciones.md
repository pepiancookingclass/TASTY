# Plan de validación dirección vs geolocalización (Nominatim + Haversine)

Objetivo: reducir pedidos falsos y discrepancias entre dirección escrita y ubicación real, sin romper el checkout. Más adelante se sumarán zonas de riesgo.

## Alcance
- Página: `/checkout`.
- Validación previa a confirmar pedido.
- Fuentes:
  - Dirección ingresada (calle, municipio, departamento, país).
  - Ubicación final elegida (GPS o mapa).
  - Geocodificación con Nominatim (API pública, uso ocasional).

## Flujo propuesto
1) Usuario llena dirección y elige ubicación (GPS/mapa).
2) Al “Guardar dirección” o justo antes de “Confirmar pedido”:
   - Geocode con Nominatim usando la dirección completa.
   - Calcular distancia Haversine entre:
     - Coordenadas devueltas por Nominatim.
     - `finalLocation` (GPS/manual).
3) Evaluar umbral:
   - Si `distanceKm > 0.5` (500 m): mostrar advertencia y bloquear o pedir confirmación explícita.
   - Si `distanceKm <= 0.5`: permitir continuar.
4) Si Nominatim falla o no encuentra resultados: permitir continuar pero mostrar aviso (“No se pudo validar la distancia, revisa tu dirección”).

## Llamada a Nominatim
- Endpoint: `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=<encoded address>&accept-language=es`
- `q`: `street, municipality, department, Guatemala`
- Headers: `User-Agent` custom.
- Rate: respetar uso ocasional (≥1s entre requests); cachear por dirección normalizada.

## Ubicación en la UI
- Card “Información de Entrega”:
  - Al pulsar “Guardar Cambios”, disparar validación (con debounce 500-800ms).
  - Mostrar estado: loading / resultado / advertencia.
- Card “Confirmar Pedido”:
  - Si advertencia sigue activa (>500 m), deshabilitar el botón o pedir “Confirmar bajo mi responsabilidad”.

## Salvaguardas para no crashear
- No colocar en un `useEffect` que dependa de todo; disparar solo en acción de usuario.
- Cancelar/ignorar resultados si el componente se desmonta.
- Manejar timeouts/errores de red sin reintentar en loop.
- No mezclar con el cálculo de delivery SQL; mantener funciones separadas.

## Lógica de decisión
- `distanceKm = haversine(nominatim.lat, nominatim.lon, finalLocation.lat, finalLocation.lng)`
- Umbral inicial: `0.5 km`.
- Mensajes:
  - OK: “Dirección y ubicación coherentes (distancia ~X m)”.
  - Advertencia: “Distancia >500 m entre dirección y ubicación; revisa o confirma bajo tu responsabilidad”.

## Datos a mostrar en el warning
- Dirección usada para geocode (cadena).
- Coordenadas Nominatim vs ubicación elegida.
- Distancia estimada (m o km).
- Botones: “Reintentar validación” / “Editar dirección” / (opcional) “Continuar de todos modos”.

## Pasos de implementación (futuros)
1) Crear helper `validateAddressDistance(address, finalLocation)` en `src/lib/`:
   - Normaliza dirección.
   - Fetch a Nominatim.
   - Haversine.
   - Devuelve `{ ok: boolean, distanceKm, nominatimCoords, warning?: string }`.
2) En `/checkout`:
   - Al guardar dirección o antes del submit, llamar helper.
   - Guardar resultado en estado (ok/warning/error).
   - Bloquear/habilitar el botón según el resultado.
3) UI:
   - Banner/alerta en “Información de Entrega”.
   - Tooltip o texto breve junto al botón de confirmación si se permite bypass.
4) Pruebas:
   - Caso OK: dirección y pin cercanos (<500 m).
   - Caso advertencia: pin lejos de dirección (>500 m).
   - Caso sin resultados Nominatim.
   - Caso error de red.

## Riesgos
- Rate limiting de Nominatim: mitigar con debounce + cache + uso solo en acción explícita.
- Falsos positivos si la dirección es ambigua: permitir bypass consciente.
- No bloquear el checkout por fallos externos: siempre dejar salida controlada.

