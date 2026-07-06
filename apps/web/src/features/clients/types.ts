export type ClientType = 'BUYER' | 'SELLER' | 'BOTH';
export type Temperature = 'HOT' | 'WARM' | 'COLD';
export type Operation = 'SALE' | 'RENT';

export interface ClientRequirement {
  operation: Operation;
  propertyType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency: string;
  bedroomsMin?: number | null;
  bathroomsMin?: number | null;
  areaMin?: number | null;
  zones: string[];
  notes?: string | null;
}

export interface Client {
  id: string;
  type: ClientType;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  temperature: Temperature;
  score: number;
  notes?: string | null;
  lastContactAt?: string | null;
  createdAt: string;
  requirement?: ClientRequirement | null;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  actorType: string;
  createdAt: string;
}

export interface ClientDetail extends Client {
  activities: Activity[];
  owner: { firstName: string; lastName: string };
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ClientFilters {
  type?: 'BUYER' | 'SELLER';
  temperature?: Temperature;
  q?: string;
  page?: number;
}

export interface CreateClientInput {
  type: ClientType;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  source?: string;
  temperature: Temperature;
  notes?: string;
  requirement?: ClientRequirement;
}
