import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { convert, round2, type Rates } from '@/lib/convert';
import {
  currencySymbol,
  currencyName,
  format,
  formatNumber,
  type Currency,
} from '@/lib/format';

const CURRENCIES: Currency[] = ['VES', 'USD', 'USDT', 'EUR'];

/** Tasa efectiva (override manual si existe, si no la de la API) desde el estado. */
function eff(s: { overrides: Record<string, number | null>; fetched: Record<string, { rate: number } | null> }, k: string): number {
  const ov = s.overrides[k];
  return ov != null ? ov : (s.fetched[k]?.rate ?? 0);
}

export function Calculator() {
  // Suscripciones a valores primitivos: el componente se re-renderiza cuando
  // cambia la tasa (no cuando cambia la identidad de la acción, como pasaba
  // antes con el useMemo congelado en effective).
  const usd = useStore((s) => eff(s, 'usd'));
  const usdt = useStore((s) => eff(s, 'usdt'));
  const eur = useStore((s) => eff(s, 'eur'));
  const status = useStore((s) => s.status);

  const [raw, setRaw] = useState('100');
  const [from, setFrom] = useState<Currency>('USD');

  const rates: Rates = { usd, usdt, eur };

  // El input admite coma o punto como decimal; se normaliza a número.
  const amount = useMemo(() => {
    const n = parseFloat(raw.replace(',', '.').replace(/\s/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [raw]);

  const others = CURRENCIES.filter((c) => c !== from);

  const ready = rates.usd > 0 && rates.usdt > 0 && rates.eur > 0;

  return (
    <div className="card">
      <label className="label" htmlFor="amount">
        Monto
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
          {currencySymbol(from)}
        </span>
        <input
          id="amount"
          className="input py-4 pl-14 text-2xl font-semibold tracking-tight"
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0,00"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <p className="label mt-4">Convertir desde</p>
      <div className="grid grid-cols-4 gap-2">
        {CURRENCIES.map((c) => {
          const active = c === from;
          return (
            <button
              key={c}
              onClick={() => setFrom(c)}
              className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {currencySymbol(c)}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {!ready && status !== 'loading' && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            No hay tasas disponibles todavía. Toca <strong>Refrescar</strong> o
            ajústalas manualmente más abajo.
          </p>
        )}
        {others.map((c) => {
          const value = ready ? round2(convert(amount, from, c, rates)) : 0;
          return (
            <ResultRow
              key={c}
              currency={c}
              value={value}
              rate={ready ? convert(1, from, c, rates) : 0}
              dim={!ready}
              from={from}
              onPick={() => {
                setFrom(c);
                setRaw(Number.isFinite(value) ? formatNumber(value) : '');
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ResultRow({
  currency,
  value,
  rate,
  dim,
  from,
  onPick,
}: {
  currency: Currency;
  value: number;
  rate: number;
  dim: boolean;
  from: Currency;
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-left transition hover:bg-slate-100"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {currencyName(currency)}
        </p>
        <p className="text-xs text-slate-400">
          1 {currencySymbol(from)} = {rate > 0 ? formatNumber(rate, 4) : '—'} {currencySymbol(currency)}
        </p>
      </div>
      <div className={`text-right ${dim ? 'text-slate-300' : 'text-slate-900'}`}>
        <p className="text-lg font-semibold tabular-nums">{format(value, currency)}</p>
      </div>
    </button>
  );
}