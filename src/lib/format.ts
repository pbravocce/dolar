// Formateo de montos al estilo venezolano (es-VE), con símbolos por moneda.

export type Currency = 'VES' | 'USD' | 'USDT' | 'EUR';

const LOCALE = 'es-VE';

export function currencySymbol(c: Currency): string {
  switch (c) {
    case 'VES':
      return 'Bs';
    case 'USD':
      return 'US$';
    case 'USDT':
      return 'USDT';
    case 'EUR':
      return '€';
  }
}

export function currencyName(c: Currency): string {
  switch (c) {
    case 'VES':
      return 'Bolívares';
    case 'USD':
      return 'Dólar';
    case 'USDT':
      return 'USDT';
    case 'EUR':
      return 'Euro';
  }
}

/** Formatea un monto con su moneda (2 decimales). */
export function format(amount: number, c: Currency): string {
  const num = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? '−' : '';
  return `${sign}${currencySymbol(c)} ${num}`;
}

/** Solo el número, sin símbolo. */
export function formatNumber(amount: number, max = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: max,
  }).format(amount);
}

/** Fecha corta legible a partir de un ISO. */
export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    return new Intl.DateTimeFormat(LOCALE, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}