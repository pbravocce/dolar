// Cliente de tasas. USD y EUR vienen de dolarapi.com (CORS *). USDT (Binance
// P2P) no se puede pedir desde el navegador (sin CORS), así que se pide a
// nuestra propia función serverless en /api/usdt, que la trae del lado del
// servidor. Todo va envuelto en try/catch y devuelve null ante cualquier fallo:
// la UI cae a las tasas cacheadas / manuales y no crashea.

const BASE = 'https://ve.dolarapi.com';

export interface ApiRate {
  rate: number; // VES por 1 unidad (USD / USDT / EUR)
  fecha: string; // ISO de la cotización
  source?: string; // etiqueta de origen para mostrar
}

interface FetchedRates {
  usd: ApiRate | null; // BCV oficial
  usdt: ApiRate | null; // Binance P2P (USDT/VES) vía /api/usdt
  eur: ApiRate | null; // euro BCV
  fetchedAt: number;
}

async function getJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.promedio == null) return null;
    return data;
  } catch {
    return null;
  }
}

function rateOf(data: any, source: string): ApiRate | null {
  if (!data) return null;
  return {
    rate: Number(data.promedio),
    fecha: data.fechaActualizacion ?? new Date().toISOString().slice(0, 10),
    source,
  };
}

/** USDT/VES desde nuestra función serverless (/api/usdt), que lee Binance P2P. */
async function fetchUsdt(): Promise<ApiRate | null> {
  try {
    const res = await fetch('/api/usdt', { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.rate == null || !Number.isFinite(Number(data.rate))) return null;
    return {
      rate: Number(data.rate),
      fecha: data.fecha ?? new Date().toISOString().slice(0, 10),
      source: data.source ?? 'Binance P2P',
    };
  } catch {
    return null;
  }
}

/** Trae las tres tasas en paralelo. Si alguna falla, esa queda null. */
export async function fetchAllRates(): Promise<FetchedRates> {
  const [usd, eur, usdt] = await Promise.all([
    getJSON(`${BASE}/v1/dolares/oficial`),
    getJSON(`${BASE}/v1/euros/oficial`),
    fetchUsdt(),
  ]);
  return {
    usd: rateOf(usd, 'BCV · dolarapi.com'),
    usdt,
    eur: rateOf(eur, 'Euro · dolarapi.com'),
    fetchedAt: Date.now(),
  };
}