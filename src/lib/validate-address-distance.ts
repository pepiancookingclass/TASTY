type AddressInput = {
  street?: string;
  municipality?: string;
  department?: string;
  country?: string;
};

type LocationInput = {
  lat: number;
  lng: number;
};

export type AddressValidationResult = {
  ok: boolean;
  distanceKm?: number;
  nominatimCoords?: { lat: number; lon: number };
  warning?: string;
  error?: string;
};

const cache = new Map<string, { lat: number; lon: number }>();
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_TIMEOUT_MS = 8000;
const USER_AGENT = 'tasty-clean/checkout-validation';
const APPROX_THRESHOLD_KM = 3; // tolerancia de validación aproximada

function haversineKm(a: LocationInput, b: LocationInput) {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(Math.max(0, h)));
}

function buildQuery(address: AddressInput) {
  const rawParts = [
    address.street,
    address.municipality,
    address.department,
    address.country || 'Guatemala',
  ]
    .filter((s): s is string => Boolean(s))
    .map((s) => s.trim())
    .filter((s): s is string => Boolean(s));

  // Evitar repeticiones de país/ciudad (ej. Guatemala duplicado)
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const part of rawParts) {
    const key = part.toLowerCase();
    if (key === 'guatemala' && seen.has('guatemala')) continue;
    seen.add(key);
    parts.push(part);
  }

  return parts.join(', ');
}

async function fetchWithTimeout(url: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function validateAddressDistance(
  address: AddressInput,
  finalLocation: LocationInput,
  thresholdKm = 0.5
): Promise<AddressValidationResult> {
  const query = buildQuery(address);
  console.log('📍 VALIDACIÓN DIRECCIÓN:', { query, finalLocation, thresholdKm });
  if (!query) {
    return { ok: false, error: 'Dirección incompleta para validar' };
  }

  // Cache por dirección normalizada
  const cached = cache.get(query.toLowerCase());
  let nominatimCoords = cached;
  let usedFallback = false;

  try {
    const fetchNominatim = async (q: string, target: LocationInput) => {
      const delta = 0.2; // ~22 km en lat/lon, acota a zona cercana
      const viewbox = `${target.lng - delta},${target.lat + delta},${target.lng + delta},${target.lat - delta}`; // left,top,right,bottom
      const url = `${NOMINATIM_URL}?format=json&limit=5&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(
        q
      )}&accept-language=es`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        console.error('❌ VALIDACIÓN NOMINATIM ERROR HTTP', {
          query: q,
          finalLocation,
          status: res.status,
          statusText: res.statusText,
        });
        return { ok: false as const, data: null as Array<any> | null, status: res.status };
      }
      const data = (await res.json()) as Array<any>;
      return { ok: true as const, data, status: res.status };
    };

    const pickNearest = (data: Array<any>, target: LocationInput) => {
      if (!data || data.length === 0) return null;
      let best = null as { lat: number; lon: number } | null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const entry of data) {
        if (!entry?.lat || !entry?.lon) continue;
        const candidate = { lat: Number(entry.lat), lon: Number(entry.lon) };
        if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lon)) continue;
        const dist = haversineKm({ lat: candidate.lat, lng: candidate.lon }, target);
        if (dist < bestDist) {
          bestDist = dist;
          best = candidate;
        }
      }
      return best;
    };

    if (!nominatimCoords) {
      // Intento principal con calle completa
      const primary = await fetchNominatim(query, finalLocation);
      if (!primary.ok) {
        return { ok: false, error: `Nominatim respondió ${primary.status}` };
      }
      let coords = pickNearest(primary.data || [], finalLocation);

      // Intento intermedio: si la calle contiene "zona X", buscar por zona+municipio+depto
      if (!coords && address.street) {
        const zoneMatch = address.street.match(/zona\s+(\d+)/i);
        if (zoneMatch) {
          const zonePart = `zona ${zoneMatch[1]}`;
          const zoneQuery = buildQuery({
            street: zonePart,
            municipality: address.municipality,
            department: address.department,
            country: address.country || 'Guatemala',
          });
          const zoneRes = await fetchNominatim(zoneQuery, finalLocation);
          if (zoneRes.ok) {
            coords = pickNearest(zoneRes.data || [], finalLocation);
            if (coords) {
              console.warn('⚠️ VALIDACIÓN CON ZONA', {
                query,
                zoneQuery,
                finalLocation,
                status: zoneRes.status,
                data: zoneRes.data,
              });
            }
          }
        }
      }

      // Fallback sin calle (solo municipio/departamento/país) para direcciones ruidosas
      if (!coords) {
        const fallbackQuery = [
          address.municipality,
          address.department,
          address.country || 'Guatemala',
        ]
          .filter((s): s is string => Boolean(s))
          .map((s) => s.trim())
          .filter((s): s is string => Boolean(s))
          .join(', ');
        const fallback = await fetchNominatim(fallbackQuery, finalLocation);
        if (fallback.ok) {
          coords = pickNearest(fallback.data || [], finalLocation);
          usedFallback = true;
          console.warn('⚠️ VALIDACIÓN SIN RESULTADOS (FALLBACK)', {
            query,
            fallbackQuery,
            finalLocation,
            status: fallback.status,
            data: fallback.data,
          });
        } else {
          console.warn('⚠️ VALIDACIÓN SIN RESULTADOS', {
            query,
            finalLocation,
            status: primary.status,
            data: primary.data,
          });
        }
      }

      if (!coords) {
        return {
          ok: false,
          warning: 'No se pudo validar la distancia: Nominatim no encontró la dirección',
        };
      }

      nominatimCoords = coords;
      cache.set(query.toLowerCase(), nominatimCoords);
    }

    if (
      !Number.isFinite(nominatimCoords.lat) ||
      !Number.isFinite(nominatimCoords.lon)
    ) {
      return {
        ok: false,
        warning: 'No se pudo validar la distancia: coordenadas inválidas',
      };
    }

    const distanceKm = haversineKm(
      { lat: nominatimCoords.lat, lng: nominatimCoords.lon },
      finalLocation
    );
    console.info('📐 VALIDACIÓN DISTANCIA', {
      distanceKm,
      thresholdKm,
      query,
      nominatimCoords,
      finalLocation,
      distanceMeters: Math.round(distanceKm * 1000),
    });

    let ok = distanceKm <= thresholdKm;
    let approx = false;

    // Permitir hasta APPROX_THRESHOLD_KM (principal o fallback) con warning suave.
    if (!ok && distanceKm <= APPROX_THRESHOLD_KM) {
      ok = true;
      approx = true;
      console.warn('⚠️ VALIDACIÓN APROXIMADA', {
        distanceKm,
        thresholdKm,
        approxThresholdKm: APPROX_THRESHOLD_KM,
        query,
        nominatimCoords,
        finalLocation,
        usedFallback,
      });
    }

    if (ok) {
      console.info('✅ VALIDACIÓN OK', {
        distanceKm,
        thresholdKm,
        query,
        nominatimCoords,
        finalLocation,
      });
    } else {
      console.warn('⚠️ VALIDACIÓN DISTANCIA FUERA DE UMBRAL', {
        distanceKm,
        thresholdKm,
        query,
        nominatimCoords,
        finalLocation,
      });
    }
    return {
      ok,
      distanceKm,
      nominatimCoords,
      warning: ok
        ? approx
          ? `Validación aproximada: usamos ubicación general (<=${APPROX_THRESHOLD_KM} km)`
          : undefined
        : `Distancia > ${thresholdKm * 1000} m entre dirección y ubicación`,
    };
  } catch (error: any) {
    console.error('❌ VALIDACIÓN NOMINATIM ERROR', {
      query,
      finalLocation,
      error,
    });
    if (error?.name === 'AbortError') {
      return { ok: false, warning: 'Validación tardó demasiado (timeout)' };
    }
    return {
      ok: false,
      error: 'Error validando dirección con Nominatim',
    };
  }
}

