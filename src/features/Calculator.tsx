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

type RateKey = 'usd' | 'usdt' | 'eur';

/** Clave de tasa interna a partir de la moneda (VES no tiene: es la base). */
function keyOf(c: Currency): RateKey {
  return c === 'USD' ? 'usd' : c === 'USDT' ? 'usdt' : 'eur';
}

/** Tasa efectiva (override manual si existe, si no la de la API) desde el estado. */
function eff(
  s: { overrides: Record<string, number | null>; fetched: Record<string, { rate: number } | null> },
  k: string,
): number {
  const ov = s.overrides[k];
  return ov != null ? ov : (s.fetched[k]?.rate ?? 0);
}

export function Calculator() {
  const usd = useStore((s) => eff(s, 'usd'));
  const usdt = useStore((s) => eff(s, 'usdt'));
  const eur = useStore((s) => eff(s, 'eur'));
  const overrides = useStore((s) => s.overrides);
  const setOverride = useStore((s) => s.setOverride);
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

  /** Tasa mostrable debajo de cada botón (Bs por unidad). */
  const rateFor = (c: Currency): number => {
    if (c === 'VES') return 1; // base
    return rates[keyOf(c)];
  };
  /** ¿La tasa de esta moneda está fijada a mano? */
  const isOverridden = (c: Currency): boolean => c !== 'VES' && overrides[keyOf(c)] != null;

  return (
    <div className="card">
      <label className="label" htmlFor="amount">
        Monto
      </label>
      <div className="input flex items-center gap-2 px-3">
        <span className="shrink-0 text-lg font-semibold text-slate-400">
          {currencySymbol(from)}
        </span>
        <input
          id="amount"
          className="w-full bg-transparent py-4 text-2xl font-semibold tracking-tight outline-none"
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0,00"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {!ready && status !== 'loading' && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No hay tasas todavía. Toca <strong>Refrescar</strong> o ajusta el número
          debajo de un botón.
        </p>
      )}

      {/* Botones con la tasa debajo (Bs por unidad). Toca el símbolo para
          elegir la moneda de origen; toca el número para ajustarla a mano. */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {CURRENCIES.map((c) => (
          <CurrencyButton
            key={c}
            currency={c}
            active={c === from}
            rate={rateFor(c)}
            overridden={isOverridden(c)}
            editable={c !== 'VES'}
            onSelect={() => setFrom(c)}
            onSave={(v) => setOverride(keyOf(c), v)}
            onReset={() => setOverride(keyOf(c), null)}
          />
        ))}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-slate-400">
        Tasa en Bs por unidad · toca el número para ajustar
      </p>

      {/* Equivalente en las otras tres monedas */}
      <div className="mt-3 space-y-1.5">
        {others.map((c) => {
          const value = ready ? round2(convert(amount, from, c, rates)) : 0;
          return (
            <div
              key={c}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5"
            >
              <span className="text-sm font-medium text-slate-500">{currencyName(c)}</span>
              <span className={`text-lg font-semibold tabular-nums ${ready ? 'text-slate-900' : 'text-slate-300'}`}>
                {format(value, c)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrencyButton({
  currency,
  active,
  rate,
  overridden,
  editable,
  onSelect,
  onSave,
  onReset,
}: {
  currency: Currency;
  active: boolean;
  rate: number;
  overridden: boolean;
  editable: boolean;
  onSelect: () => void;
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
    <div
      className={`flex flex-col overflow-hidden rounded-xl border text-center transition ${
        active
          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <button
        onClick={onSelect}
        className="py-2 text-base font-bold text-slate-700"
        aria-pressed={active}
      >
        {currencySymbol(currency)}
      </button>

      {editing ? (
        <div className="flex items-center justify-center gap-1 border-t border-slate-200 px-1 py-1">
          <input
            className="w-16 rounded-md border border-slate-200 px-1 py-1 text-right text-xs outline-none focus:border-brand-500"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={save}
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={editable ? startEdit : undefined}
          disabled={!editable}
          className="flex items-center justify-center gap-0.5 border-t border-slate-100 px-1 py-1.5 text-xs font-medium tabular-nums text-slate-500 disabled:cursor-default"
        >
          {rate > 0 ? formatNumber(rate) : '—'}
          {overridden && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-brand-500" title="ajustada a mano" />}
        </button>
      )}

      {overridden && !editing && (
        <button
          onClick={onReset}
          className="border-t border-slate-100 py-0.5 text-[10px] text-brand-600 hover:underline"
        >
          auto
        </button>
      )}
    </div>
  );
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}