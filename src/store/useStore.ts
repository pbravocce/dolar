import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchAllRates, type ApiRate } from '@/lib/rates';

type RateKey = 'usd' | 'usdt' | 'eur';

interface State {
  // Tasas que trajo la API (cacheadas para uso offline).
  fetched: Record<RateKey, ApiRate | null>;
  // Overrides manuales: si están, se usan en lugar de las de la API.
  overrides: Record<RateKey, number | null>;
  lastFetchedAt: number | null;

  status: 'idle' | 'loading' | 'ok' | 'error';
  lastError: string | null;

  refresh: () => Promise<void>;
  setOverride: (key: RateKey, value: number | null) => void;

  /** Tasa efectiva a usar (override si existe, si no la de la API, si no 0). */
  effective: (key: RateKey) => number;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      fetched: { usd: null, usdt: null, eur: null },
      overrides: { usd: null, usdt: null, eur: null },
      lastFetchedAt: null,
      status: 'idle',
      lastError: null,

      refresh: async () => {
        set({ status: 'loading', lastError: null });
        try {
          const data = await fetchAllRates();
          set({
            fetched: { usd: data.usd, usdt: data.usdt, eur: data.eur },
            lastFetchedAt: data.fetchedAt,
            status: 'ok',
          });
        } catch (e) {
          set({ status: 'error', lastError: e instanceof Error ? e.message : 'Error' });
        }
      },

      setOverride: (key, value) => {
        set((s) => ({ overrides: { ...s.overrides, [key]: value } }));
      },

      effective: (key) => {
        const s = get();
        const ov = s.overrides[key];
        if (ov != null && !Number.isNaN(ov)) return ov;
        return s.fetched[key]?.rate ?? 0;
      },
    }),
    {
      name: 'dolar-ve-store',
      // version 1: cambia la fuente de USDT (antes "paralelo" 857, ahora Binance).
      // Subir la versión descarta el caché viejo de localStorage para que no
      // quede pegada la tasa anterior.
      version: 1,
    },
  ),
);