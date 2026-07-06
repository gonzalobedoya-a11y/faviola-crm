export type Operation = 'SALE' | 'RENT';
export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'OFF';

export interface PropertyMedia {
  id: string;
  url: string;
  type: string;
  isCover: boolean;
  order: number;
}

export interface Property {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  operation: Operation;
  propertyType?: string | null;
  status: PropertyStatus;
  price: number;
  currency: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  builtArea?: number | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  media: PropertyMedia[];
}

export interface PropertyDetail extends Property {
  owner?: { id: string; firstName: string; lastName: string } | null;
  agent?: { firstName: string; lastName: string };
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface PropertyFilters {
  operation?: Operation;
  status?: PropertyStatus;
  q?: string;
  page?: number;
}

export interface CreatePropertyInput {
  title: string;
  description?: string;
  operation: Operation;
  propertyType?: string;
  status: PropertyStatus;
  price: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  address?: string;
  district?: string;
  city?: string;
  images?: string[];
}
