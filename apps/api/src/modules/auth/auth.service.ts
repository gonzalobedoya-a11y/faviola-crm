import { verify } from '@node-rs/argon2';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import type { JwtPayload, PublicUser, RequestContext } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import { TokensService } from './tokens.service';

const REFRESH_TTL_DAYS = 7;

interface IssuedTokens {
  accessToken: string;
  /** Valor que viaja en la cookie httpOnly: `sessionId.rawRefreshToken`. */
  refreshCookie: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  async login(dto: LoginDto, ctx: RequestContext): Promise<IssuedTokens & { user: PublicUser }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, status: 'ACTIVE' },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const passwordOk = user ? await verify(user.passwordHash, dto.password) : false;
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.code);
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role.name,
      permissions,
    };

    const issued = await this.issueTokens(payload, ctx);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { ...issued, user: this.toPublicUser(user) };
  }

  async refresh(cookieValue: string, ctx: RequestContext): Promise<IssuedTokens> {
    const [sessionId, raw] = cookieValue.split('.');
    if (!sessionId || !raw) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Detección de reuso: si el token ya fue rotado, se comprometió → revoca todo.
    if (session.revokedAt) {
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Sesión inválida');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('La sesión expiró');
    }

    const valid = await this.tokens.verifyRefreshToken(session.refreshTokenHash, raw);
    if (!valid) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Rotación: revoca la sesión actual y emite una nueva.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const permissions = session.user.role.permissions.map((rp) => rp.permission.code);
    const payload: JwtPayload = {
      sub: session.user.id,
      tenantId: session.user.tenantId,
      role: session.user.role.name,
      permissions,
    };

    return this.issueTokens(payload, ctx);
  }

  async logout(cookieValue: string | undefined): Promise<void> {
    if (!cookieValue) return;
    const [sessionId] = cookieValue.split('.');
    if (!sessionId) return;
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<PublicUser & { permissions: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      ...this.toPublicUser(user),
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    };
  }

  private async issueTokens(payload: JwtPayload, ctx: RequestContext): Promise<IssuedTokens> {
    const accessToken = this.tokens.signAccessToken(payload);
    const raw = this.tokens.generateRefreshToken();
    const refreshTokenHash = await this.tokens.hashRefreshToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId: payload.sub,
        refreshTokenHash,
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        expiresAt,
      },
    });

    return { accessToken, refreshCookie: `${session.id}.${raw}` };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    role: { name: string };
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId,
      role: user.role.name,
    };
  }
}
