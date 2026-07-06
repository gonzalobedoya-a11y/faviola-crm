import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { JwtPayload } from '../../modules/auth/auth.types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Guard global de autorización (RBAC). Corre tras `JwtAuthGuard`.
 * Si la ruta no declara permisos con `@RequirePermissions()`, permite el paso.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const granted = request.user?.permissions ?? [];
    const allowed = required.every((permission) => granted.includes(permission));

    if (!allowed) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
