import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Exige permisos (recurso.acción) para acceder a una ruta.
 * Los evalúa `PermissionsGuard` contra los permisos del usuario en el JWT.
 */
export const RequirePermissions = (...permissions: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
