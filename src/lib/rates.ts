// Cliente de tasas. USD y EUR vienen de dolarapi.com (CORS *). USDT/VES viene
// de CriptoYa (https://criptoya.com/api/USDT/VES/1), que también expone CORS *,
// así que se pide directo desde el navegador. Como respaldo si CriptoYa falla,
// cae a nuestra función serverless /api/usdt (server-side, sin CORS). Todo va
// envuelto en try/catch y devuelve null ante cualquier fallo: la UI cae a las
// tasas cacheadas / manuales y no crashea.

const BASE = 'https://ve.dolarapi.com';
const CRIPTOYA_URL = 'https://criptoya.com/api/USDT/VES/1';

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

/**
 * USDT/VES desde CriptoYa, que devuelve un objeto con varias plataformas P2P
 * (binancep2p, okexp2p, bybitp2p, ...). Usamos binancep2p y el punto medio de
 * ask/bid — equivalente a la mediana de anuncios BUY+SELL que se usaba antes.
 * Devuelve null si la respuesta no trae un precio usable.
 */
function rateFromCriptoYa(data: any): ApiRate | null {
  const bin = data?.binancep2p;
  if (!bin) return null;
  const ask = Number(bin.ask);
  const bid = Number(bin.bid);
  const prices = [ask, bid].filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return null;
  const rate = prices.length === 2 ? (ask + bid) / 2 : prices[0];
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const fecha = bin.time
    ? new Date(bin.time * 1000).toISOString().slice(0, 19) + 'Z'
    : new Date().toISOString().slice(0, 10);
  return {
    rate: Math.round((rate + Number.EPSILON) * 100) / 100,
    fecha,
    source: 'Binance P2P · CriptoYa',
  };
}

/**
 * USDT/VES. Primario: CriptoYa directo desde el navegador (CORS *). Respaldo:
 * nuestra función serverless /api/usdt (server-side, sin CORS), por si CriptoYa
 * cambia su política de CORS en el futuro. null si ambos fallan.
 */
async function fetchUsdt(): Promise<ApiRate | null> {
  try {
    const res = await fetch(CRIPTOYA_URL, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const rate = rateFromCriptoYa(await res.json());
      if (rate) return rate;
    }
  } catch {
    // ignora y cae al respaldo
  }
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