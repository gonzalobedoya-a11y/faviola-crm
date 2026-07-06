import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { TokensService } from '../../modules/auth/tokens.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global de autenticación. Verifica el JWT de acceso y puebla `req.user`.
 * Las rutas marcadas con `@Public()` se omiten.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokensService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    try {
      request.user = this.tokens.verifyAccessToken(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
