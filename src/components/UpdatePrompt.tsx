import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Aviso de "nueva versión disponible" para la PWA. Muestra una tarjeta
 *  abajo; al aceptar, activa el service worker nuevo y recarga. */
export function UpdatePrompt() {
  const [show, setShow] = useState(true);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: () => {
      // cada hora busca si hay novedades
    },
  });

  if (!needRefresh || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg">
        <span className="text-sm">Hay una versión nueva de la app.</span>
        <div className="flex gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
            onClick={() => setShow(false)}
          >
            Ahora no
          </button>
          <button
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
            onClick={() => updateServiceWorker(true)}
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}