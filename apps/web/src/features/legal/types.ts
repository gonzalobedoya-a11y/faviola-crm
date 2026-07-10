export type LegalDocType =
  'TITULO_DOMINIO' | 'PARTIDA' | 'DNI' | 'ESTUDIO_TITULO' | 'CORRETAJE' | 'OTROS';

export type DossierStatus = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';

export interface LegalDocument {
  id: string;
  type: LegalDocType;
  name: string;
  createdAt: string;
}

export interface LegalDossier {
  property: {
    id: string;
    code: string;
    title: string;
    propertyType?: string | null;
    address?: string | null;
    district?: string | null;
  };
  legal: {
    contract: 'EXCLUSIVO' | 'NO_EXCLUSIVO';
    corretajeExpiry?: string | null;
    cancelled: boolean;
    notes?: string | null;
  };
  documents: LegalDocument[];
  status: DossierStatus;
}

export interface LegalOverview {
  items: LegalDossier[];
  counts: Record<DossierStatus, number>;
  exclusiveCount: number;
}
