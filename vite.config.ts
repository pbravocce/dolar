import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { getBinanceUsdtRate } from './api/binanceP2P.js';

// En desarrollo (npm run dev) no hay runtime de Azure Functions, así que este
// plugin sirve /api/usdt desde el propio servidor de Vite (server-side, sin
// CORS). En producción, Azure Static Web Apps responde /api/usdt con la
// función de api/usdt.js. Mismo contrato { rate, source, fecha } en ambos.
const apiDev: Plugin = {
  name: 'dolar-ve-api-dev',
  configureServer: (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/usdt')) return next();
      try {
        const r = await getBinanceUsdtRate();
        if (!r) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'no-rate' }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(r));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: String(e) }));
      }
    });
  },
};

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    apiDev,
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Dólar VE',
        short_name: 'DólarVE',
        description: 'Calculadora de cambio USD / USDT / EUR ↔ Bolívares (BCV, Binance, euro)',
        theme_color: '#047857',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'es-VE',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: { host: true, port: 5174 },
});