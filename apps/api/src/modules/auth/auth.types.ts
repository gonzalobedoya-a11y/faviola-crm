export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
}

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}
