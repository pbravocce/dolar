# Cómo publicar Dólar VE

Es una **PWA** (instalable en el celular) con una pequeña **función serverless**
para traer la tasa USDT de Binance (Binance P2P no permite CORS desde el
navegador, así que la pide el servidor). La misma solución que *Mi Presupuesto*:
**Azure Static Web Apps**.

## Por qué hay un backend mínimo

| Tasa | Origen | CORS en navegador |
|---|---|---|
| USD (BCV) | `ve.dolarapi.com/v1/dolares/oficial` | ✅ directo |
| EUR (BCV) | `ve.dolarapi.com/v1/euros/oficial` | ✅ directo |
| USDT (Binance) | Binance P2P → función `/api/usdt` | ❌ (la trae el servidor) |

La carpeta `api/` contiene la función (Azure Functions v4). En desarrollo
`npm run dev` la sirve el propio Vite (mismo contrato), así que no hace falta
Azure para probar localmente.

---

## Paso 1 — Subir el repo a GitHub

1. En github.com → **New repository** → `dolar` (Public o Private, sin README).
2. Desde `C:\Temp\dolar`:

   ```bash
   git init
   git add .
   git commit -m "Dólar VE"
   git remote add origin https://github.com/pbravocce/dolar.git
   git branch -M main
   git push -u origin main
   ```

   (Si pedirá contraseña, usá un **Personal Access Token** con permiso `repo`.)

## Paso 2 — Crear el Static Web App en Azure

1. portal.azure.com → **Static Web Apps** → **Create**.
2. Completá: Name `dolarve`, Plan **Free**, Region cercana.
3. Deployment details: Source **GitHub** → tu repo `dolar` → branch `main`.
4. **Build Presets**: **Vite** (autocompleta). Dejá:
   - **App location**: `/`
   - **Api location**: `api`   ← ⚠️ importante (activa la carpeta de funciones)
   - **Output location**: `dist`
5. **Review + create** → **Create**.

> Si ya tenés un SWA creado y solo querés cambiarlo, entrá al recurso →
> **Configuration** → **App settings** y dejás **Api location** = `api`.

## Paso 3 — Verificar

1. En GitHub → pestaña **Actions**: tilde verde ⇒ publicado.
2. Abrí la URL de Azure en el celular → **Agregar a pantalla de inicio**.

   URL publicada: <https://salmon-glacier-098a4c40f.7.azurestaticapps.net>
3. La tasa USDT debe aparecer con fuente “Binance P2P (USDT/VES)”. Si muestra
   “—”, confirmá que el **Api location** quedó en `api` (paso 4).

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5174  (incluye /api/usdt via Vite)
```

Sin internet, la app usa las últimas tasas cacheadas (o las que hayas fijado
a mano con el lápiz).