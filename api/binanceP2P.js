// Lógica SERVER-SIDE para obtener la tasa USDT/VES de Binance.
// Corre en el servidor (Azure Function) o en el dev server de Vite, NUNCA en
// el navegador: Binance P2P no envía CORS y bloquearía el fetch del cliente.
// Sin dependencias externas: usa el fetch global de Node (>=18).
//
// Estrategia: pedimos anuncios BUY y SELL del par USDT/VES en Binance P2P,
// filtramos los que tienen liquidez razonable (>= 50 USDT) para descartar ruido
// (anuncios tiny con precios extremos), y tomamos la mediana de los precios.
// Eso coincide con el "precio" que muestra binance.com/es-LA/price/tether/VES.
// Como respaldo si Binance falla, usamos usdt.com.ve/api/rates (que replica Binance).

const P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
const BASE = { fiat: 'VES', page: 1, rows: 20, asset: 'USDT', countries: [], payTypes: [] };
const FALLBACK_URL = 'https://www.usdt.com.ve/api/rates';

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function median(nums) {
  if (!nums.length) return NaN;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function search(tradeType) {
  try {
    const res = await fetch(P2P_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ ...BASE, tradeType }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []).map((a) => ({
      price: Number(a?.adv?.price),
      tradable: Number(a?.adv?.tradableQuantity ?? 0),
    }));
  } catch {
    return [];
  }
}

async function fromBinance() {
  const [sell, buy] = await Promise.all([search('BUY'), search('SELL')]);
  const liquid = [...sell, ...buy]
    .filter((x) => Number.isFinite(x.price) && x.tradable >= 50)
    .map((x) => x.price);
  const all = [...sell, ...buy].map((x) => x.price).filter(Number.isFinite);
  const rate = median(liquid.length >= 4 ? liquid : all);
  if (!Number.isFinite(rate)) return null;
  return {
    rate: round2(rate),
    source: 'Binance P2P (USDT/VES)',
    fecha: new Date().toISOString().slice(0, 19) + 'Z',
  };
}

async function fromUsdtComVe() {
  try {
    const res = await fetch(FALLBACK_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const j = await res.json();
    const b = j?.data?.binance;
    const rate = b && (Number(b.buyRate) || Number(b.sellRate));
    if (!Number.isFinite(rate)) return null;
    return {
      rate: round2(rate),
      source: 'Binance (vía usdt.com.ve)',
      fecha: j?.data?.capturedAt ?? new Date().toISOString().slice(0, 19) + 'Z',
    };
  } catch {
    return null;
  }
}

/** Tasa USDT/VES de Binance (P2P directo, con respaldo). null si todo falla. */
export async function getBinanceUsdtRate() {
  return (await fromBinance()) ?? (await fromUsdtComVe());
}