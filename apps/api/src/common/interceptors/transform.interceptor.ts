import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiEnvelope<T> {
  data: T;
}

/**
 * Envuelve toda respuesta exitosa en `{ data }` para un contrato uniforme.
 * Los listados paginados añadirán `meta` en sus servicios (Blueprint §4.1).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
