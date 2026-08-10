import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { formatDate, formatNumber } from '@/lib/format';

type RateKey = 'usd' | 'usdt' | 'eur';

interface Row {
  key: RateKey;
  label: string;
  source: string;
}

const ROWS: Row[] = [
  { key: 'usd', label: 'Dólar (BCV)', source: 'BCV · dolarapi.com' },
  { key: 'usdt', label: 'USDT (Binance)', source: 'Binance P2P · /api/usdt' },
  { key: 'eur', label: 'Euro (BCV)', source: 'Euro · dolarapi.com' },
];

export function RatesPanel() {
  const fetched = useStore((s) => s.fetched);
  const overrides = useStore((s) => s.overrides);
  const effective = useStore((s) => s.effective);
  const setOverride = useStore((s) => s.setOverride);
  const lastFetchedAt = useStore((s) => s.lastFetchedAt);
  const status = useStore((s) => s.status);

  return (
    <div className="mt-4 card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Tasas (Bs por unidad)</h2>
        {lastFetchedAt && (
          <span className="text-xs text-slate-400">
            Actualizado {formatDate(new Date(lastFetchedAt).toISOString())}
          </span>
        )}
      </div>

      {status === 'error' && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          No se pudieron traer las tasas. Revisa tu conexión o ajústalas a mano.
        </p>
      )}

      <div className="space-y-2">
        {ROWS.map((row) => (
          <RateRow
            key={row.key}
            label={row.label}
            source={fetched[row.key]?.source ?? row.source}
            rate={effective(row.key)}
            fecha={fetched[row.key]?.fecha}
            overridden={overrides[row.key] != null}
            onSave={(v) => setOverride(row.key, v)}
            onReset={() => setOverride(row.key, null)}
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        USD y Euro vienen de dolarapi.com (BCV). USDT viene de Binance P2P vía
        nuestra función <code className="font-mono">/api/usdt</code>. Toca el
        lápiz para fijar un valor puntual (cajero, casa de cambio); el pill
        “manual” indica cuál está editado. Toca restablecer para volver al automático.
      </p>
    </div>
  );
}

function RateRow({
  label,
  source,
  rate,
  fecha,
  overridden,
  onSave,
  onReset,
}: {
  label: string;
  source: string;
  rate: number;
  fecha?: string;
  overridden: boolean;
  onSave: (v: number | null) => void;
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(rate > 0 ? formatNumber(rate) : '');
    setEditing(true);
  };

  const save = () => {
    const n = parseFloat(draft.replace(',', '.').replace(/\s/g, ''));
    onSave(Number.isFinite(n) && n > 0 ? round(n) : null);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">
            {label}
            {overridden && (
              <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                manual
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400">{source}</p>
        </div>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              autoFocus
            />
            <button className="rounded-lg bg-brand-600 px-2 py-1.5 text-xs text-white hover:bg-brand-700" onClick={save}>
              OK
            </button>
          </div>
        ) : (
          <button className="flex items-center gap-2" onClick={startEdit}>
            <span className="text-base font-semibold tabular-nums text-slate-900">
              {rate > 0 ? formatNumber(rate) : '—'}
            </span>
            <PencilIcon />
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {fecha ? `BCV al ${formatDate(fecha)}` : 'sin fecha'}
        </span>
        {overridden && (
          <button className="text-xs text-brand-600 hover:underline" onClick={onReset}>
            Restablecer
          </button>
        )}
      </div>
    </div>
  );
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function PencilIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}