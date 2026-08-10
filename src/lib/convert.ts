import type { Currency } from '@/lib/format';

export interface Rates {
  usd: number; // Bs por 1 USD (BCV)
  usdt: number; // Bs por 1 USDT (Binance P2P)
  eur: number; // Bs por 1 EUR (euro BCV)
}

/** Bs por 1 unidad de cada moneda (Bs = 1). */
export function rateOf(c: Currency, r: Rates): number {
  switch (c) {
    case 'VES':
      return 1;
    case 'USD':
      return r.usd;
    case 'USDT':
      return r.usdt;
    case 'EUR':
      return r.eur;
  }
}

/** Convierte un monto de una moneda a otra, cruzando por bolívares. */
export function convert(amount: number, from: Currency, to: Currency, r: Rates): number {
  if (from === to) return amount;
  const inBs = amount * rateOf(from, r);
  return inBs / rateOf(to, r);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}