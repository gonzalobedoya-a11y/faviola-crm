import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { Env } from '../../config/env.validation';

import type { JwtPayload, RequestContext } from './auth.types';
import { AuthService } from './auth.service';
import { type LoginDto, loginSchema } from './dto/login.dto';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_PATH = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: unknown; accessToken: string }> {
    const result = await this.auth.login(dto, this.context(req));
    this.setRefreshCookie(res, result.refreshCookie);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const cookie = this.readRefreshCookie(req);
    if (!cookie) {
      throw new UnauthorizedException('Sesión no encontrada');
    }
    const result = await this.auth.refresh(cookie, this.context(req));
    this.setRefreshCookie(res, result.refreshCookie);
    return { accessToken: result.accessToken };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    await this.auth.logout(this.readRefreshCookie(req));
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
    return { success: true };
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.auth.me(user.sub);
  }

  private context(req: Request): RequestContext {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  private readRefreshCookie(
    req: Request & { cookies?: Record<string, string> },
  ): string | undefined {
    return req.cookies?.[REFRESH_COOKIE];
  }

  private setRefreshCookie(res: Response, value: string): void {
    const isProd = this.config.get('NODE_ENV', { infer: true }) === 'production';
    res.cookie(REFRESH_COOKIE, value, {
      httpOnly: true,
      // En producción front y API están en dominios distintos (Vercel/Railway):
      // la cookie de refresh debe ser cross-site (SameSite=None + Secure).
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      path: REFRESH_PATH,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
