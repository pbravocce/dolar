// Azure Function (modelo v4) — expone GET /api/usdt.
// Corre del lado del servidor, así que puede pedirle a Binance P2P sin problema
// de CORS y devolverle el JSON a la PWA. Azure Static Web Apps detecta la
// carpeta api/ automáticamente (ver README/DEPLOY).
import { app } from '@azure/functions';
import { getBinanceUsdtRate } from './binanceP2P.js';

app.http('usdt', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (_req, _context) => {
    try {
      const r = await getBinanceUsdtRate();
      if (!r) {
        return {
          status: 502,
          jsonBody: { error: 'no-rate', message: 'No se pudo obtener la tasa de Binance.' },
        };
      }
      return {
        jsonBody: r,
        headers: { 'Cache-Control': 'no-store' },
      };
    } catch (e) {
      return { status: 500, jsonBody: { error: String(e && e.message ? e.message : e) } };
    }
  },
});