// Lógica SERVER-SIDE para obtener la tasa USDT/VES.
// Corre en el servidor (Azure Function) o en el dev server de Vite, NUNCA en
// el navegador. Sin dependencias externas: usa el fetch global de Node (>=18).
//
// Fuente primaria: CriptoYa (https://criptoya.com/api/USDT/VES/1), que agrega
// precios P2P de varias plataformas. Usamos binancep2p y el punto medio de
// ask/bid. Respaldo 1: Binance P2P directo (anuncios BUY+SELL, mediana de los
// con liquidez >= 50 USDT). Respaldo 2: usdt.com.ve/api/rates (replica Binance).
// El cliente (src/lib/rates.ts) pide CriptoYa directo desde el navegador porque
// expone CORS *; este módulo queda como respaldo server-side (sin CORS) por si
// la política de CORS de CriptoYa cambia en el futuro.

const CRIPTOYA_URL = 'https://criptoya.com/api/USDT/VES/1';
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

async function fromCriptoYa() {
  try {
    const res = await fetch(CRIPTOYA_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
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
      : new Date().toISOString().slice(0, 19) + 'Z';
    return { rate: round2(rate), source: 'Binance P2P · CriptoYa', fecha };
  } catch {
    return null;
  }
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

/** Tasa USDT/VES. CriptoYa primero, luego Binance P2P directo, luego usdt.com.ve. null si todo falla. */
export async function getBinanceUsdtRate() {
  return (await fromCriptoYa()) ?? (await fromBinance()) ?? (await fromUsdtComVe());
}