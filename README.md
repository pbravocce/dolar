# Dólar VE

Calculadora de cambio **USD · USDT · EUR ↔ Bolívares** para Venezuela, con las
tasas que operan en el país: **BCV (oficial)**, **USDT (paralelo)** y **Euro**.

Es una **PWA** (se instala en el celular como una app) hecha con React + Vite +
Tailwind. Misma familia visual que *Mi Presupuesto*.

## Cómo funciona

- Entras un monto y eliges en qué moneda está (Bs, US$, USDT o €).
- Al instante ves el equivalente en las otras tres monedas, cruzando por Bs.
- Las tasas se traen **automáticas** de [dolarapi.com](https://ve.dolarapi.com)
  al abrir la app (y con el botón **Refrescar**).
- Puedes **editar manualmente** cualquier tasa (icono lápiz) para fijar un
  valor puntual (cajero, casa de cambio); toca *Restablecer* para volver al
  valor automático. La edición se marca con la etiqueta **manual**.

## Desarrollo

```bash
npm install
npm run dev      # servidor en http://localhost:5174
npm run build    # genera dist/ (production)
npm run preview  # sirve el build de producción
```

## Instalar en el celular

1. `npm run build` y publica la carpeta `dist/` en cualquier hosting estático
   (Netlify, Vercel, GitHub Pages, o un servidor local en tu red).
2. Abre la URL en el celular (Chrome/Android o Safari/iOS) y elige
   **Agregar a pantalla de inicio**.
3. Queda como app nativa, funciona offline (las tasas cacheadas se conservan).

> Las tasas en vivo requieren internet; sin conexión se usan las últimas
> cacheadas (o las que hayas fijado a mano).

## Fuente de tasas

| Tasa | Origen |
|---|---|
| USD (BCV) | `ve.dolarapi.com/v1/dolares/oficial` (CORS *) |
| EUR (BCV) | `ve.dolarapi.com/v1/euros/oficial` (CORS *) |
| USDT (Binance) | Binance P2P, vía función serverless `/api/usdt` |

USDT no se pide directo del navegador porque Binance P2P no habilita CORS: la
trae la función en `api/` (Azure Functions) y la devuelve como JSON. En `npm
run dev` la sirve Vite. Si la función no está desplegada, USDT se puede fijar a
mano con el lápiz. Ver **DEPLOY.md** para publicar (incluido el *Api location*).