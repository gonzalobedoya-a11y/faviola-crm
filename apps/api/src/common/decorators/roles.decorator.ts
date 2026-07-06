import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Declara los roles permitidos en una ruta. Lo aplica `RolesGuard`.
 * El catálogo real de roles se define en el Sprint 1 (RBAC — Blueprint §6).
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
