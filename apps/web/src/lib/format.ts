export function formatMoney(value?: number | null, currency = 'PEN'): string {
  if (value === null || value === undefined) return '—';
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${value.toLocaleString('es-PE')}`;
}
