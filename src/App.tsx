import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Calculator } from '@/features/Calculator';
import { RatesPanel } from '@/features/RatesPanel';
import { UpdatePrompt } from '@/components/UpdatePrompt';

export default function App() {
  const status = useStore((s) => s.status);
  const refresh = useStore((s) => s.refresh);
  const lastFetchedAt = useStore((s) => s.lastFetchedAt);

  // Al abrir: trae tasas si no hay caché o si la última fue hace > 1 h.
  useEffect(() => {
    const stale = !lastFetchedAt || Date.now() - lastFetchedAt > 60 * 60 * 1000;
    if (stale) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dólar VE</h1>
            <p className="text-xs text-slate-500">
              USD · USDT · EUR ↔ Bolívares
            </p>
          </div>
          <button
            className="btn-ghost px-3 py-2 text-sm"
            onClick={() => refresh()}
            disabled={status === 'loading'}
          >
            <RefreshIcon spinning={status === 'loading'} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-10">
        <Calculator />
        <RatesPanel />
      </main>

      <UpdatePrompt />
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}