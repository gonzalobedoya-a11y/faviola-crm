import { randomBytes } from 'node:crypto';

import { hash, verify } from '@node-rs/argon2';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { JwtPayload } from './auth.types';

/**
 * Emisión y verificación de tokens.
 * - Access token: JWT firmado (corta vida).
 * - Refresh token: cadena opaca aleatoria, almacenada SOLO como hash (Argon2id).
 */
@Injectable()
export class TokensService {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token);
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  hashRefreshToken(raw: string): Promise<string> {
    return hash(raw);
  }

  verifyRefreshToken(storedHash: string, raw: string): Promise<boolean> {
    return verify(storedHash, raw);
  }
}
