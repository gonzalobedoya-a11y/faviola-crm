import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Inyecta el usuario autenticado (`req.user`) en un handler.
 * El poblado de `req.user` lo hará el guard JWT del Sprint 1.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: unknown }>();
    return request.user;
  },
);
