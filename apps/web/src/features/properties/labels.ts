import type { Operation, PropertyStatus } from './types';

export const operationLabel: Record<Operation, string> = {
  SALE: 'Venta',
  RENT: 'Alquiler',
};

export const statusLabel: Record<PropertyStatus, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservada',
  SOLD: 'Vendida',
  RENTED: 'Alquilada',
  OFF: 'Fuera de mercado',
};

export const statusClass: Record<PropertyStatus, string> = {
  AVAILABLE: 'border-success text-success',
  RESERVED: 'border-warning text-warning',
  SOLD: 'border-danger text-danger',
  RENTED: 'border-info text-info',
  OFF: 'border-border text-content-muted',
};
