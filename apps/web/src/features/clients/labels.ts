import type { ClientType, Temperature } from './types';

export const temperatureLabel: Record<Temperature, string> = {
  HOT: 'Caliente',
  WARM: 'Tibio',
  COLD: 'Frío',
};

export const temperatureClass: Record<Temperature, string> = {
  HOT: 'border-danger text-danger',
  WARM: 'border-warning text-warning',
  COLD: 'border-info text-info',
};

export const typeLabel: Record<ClientType, string> = {
  BUYER: 'Comprador',
  SELLER: 'Vendedor',
  BOTH: 'Comprador y vendedor',
};

export function formatMoney(value?: number | null, currency = 'PEN'): string {
  if (value === null || value === undefined) return '—';
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${value.toLocaleString('es-PE')}`;
}
