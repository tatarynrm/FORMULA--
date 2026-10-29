import { randomUUID } from 'node:crypto';

import { AUTH_COOKIES, type AuthSession } from '@formula/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import type { Env } from '../../config/env.js';
import { AuthCookiesService } from './auth-cookies.service.js';
import { AuthService } from './auth.service.js';
import type { RefreshPrincipal, RequestUser } from './auth.types.js';
import { CurrentRefresh, CurrentUser } from './current-user.decorator.js';
import { AuthSessionDto } from './dto/auth-session.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { GoogleAuthService } from './google-auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';

// Credential endpoints get a tighter limit than the global one to slow down brute force.
const CREDENTIALS_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

/** Only a path inside the web app may follow a sign-in (never another site). */
function safePath(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/';
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly cookies: AuthCookiesService,
    private readonly google: GoogleAuthService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get('google')
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiOperation({ summary: 'Start the Google sign-in (redirects to Google)' })
  startGoogle(@Query('next') next: unknown, @Res() response: Response): void {
    if (!this.google.enabled) {
      response.redirect(`${this.webUrl()}/login?error=google`);
      return;
    }

    const state = randomUUID();
    this.cookies.setOAuthState(response, { state, next: safePath(next) });
    response.redirect(this.google.authorizationUrl(state));
  }

  @Get('google/callback')
  @ApiOperation({
    summary:
      'Google sends the browser back here; sets the session cookies and redirects to the web app',
  })
  async googleCallback(
    @Query('code') code: unknown,
    @Query('state') state: unknown,
    @Query('error') error: unknown,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const saved = this.cookies.readOAuthState(request);
    this.cookies.clearOAuthState(response);
    const webUrl = this.webUrl();

    // Anything unexpected (user cancelled, forged or stale state) ends on the login page with a hint.
    if (error || typeof code !== 'string' || !saved || saved.state !== state) {
      response.redirect(`${webUrl}/login?error=google`);
      return;
    }

    try {
      const profile = await this.google.fetchProfile(code);
      const { user, tokens, isNew } = await this.authService.loginWithGoogle(profile);
      this.cookies.set(response, tokens);

      const home = user.role === 'admin' ? '/admin' : '/cabinet';
      const next = saved.next === '/' ? home : saved.next;
      const target = isNew ? `/onboarding?next=${encodeURIComponent(next)}` : next;
      response.redirect(`${webUrl}${target}`);
    } catch (caught) {
      this.logger.warn(`Google sign-in failed: ${(caught as Error).message}`);
      response.redirect(`${webUrl}/login?error=google`);
    }
  }

  /** Where the web app lives: `WEB_URL`, or the first allowed CORS origin. */
  private webUrl(): string {
    return (
      this.config.get('WEB_URL', { infer: true }) ??
      this.config.get('CORS_ORIGINS', { infer: true })[0] ??
      'http://localhost:3000'
    );
  }

  @Post('register')
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiOperation({ summary: 'Create an account and start a session (sets httpOnly cookies)' })
  @ApiOkResponse({ type: AuthSessionDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const { user, tokens } = await this.authService.register(dto);
    this.cookies.set(response, tokens);
    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiOperation({ summary: 'Sign in with email and password (sets httpOnly cookies)' })
  @ApiOkResponse({ type: AuthSessionDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const { user, tokens } = await this.authService.login(dto);
    this.cookies.set(response, tokens);
    return { user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth(AUTH_COOKIES.REFRESH)
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  @ApiOkResponse({ type: AuthSessionDto })
  async refresh(
    @CurrentRefresh() principal: RefreshPrincipal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    try {
      const { user, tokens } = await this.authService.refresh(principal.userId, principal.tokenId);
      this.cookies.set(response, tokens);
      return { user };
    } catch (error) {
      // A rejected refresh means the session is over, so do not leave dead cookies behind.
      this.cookies.clear(response);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End the session and clear the cookies (works even with an expired access token)',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<null> {
    await this.authService.logout(await this.readRefreshTokenId(request));
    this.cookies.clear(response);
    return null;
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiCookieAuth(AUTH_COOKIES.ACCESS)
  @ApiOperation({
    summary: 'Change the password. Every other session is ended; this device stays signed in.',
  })
  @ApiOkResponse({ type: AuthSessionDto })
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const result = await this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    this.cookies.set(response, result.tokens);
    return { user: result.user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access')
  @ApiCookieAuth(AUTH_COOKIES.ACCESS)
  @ApiOperation({ summary: 'The signed-in user' })
  @ApiOkResponse({ type: AuthSessionDto })
  async me(@CurrentUser() user: RequestUser): Promise<AuthSession> {
    return { user: await this.authService.getCurrentUser(user.userId) };
  }

  /** Logout must succeed with a broken or expired cookie, so verification errors are swallowed. */
  private async readRefreshTokenId(request: Request): Promise<string | null> {
    const token: unknown = request.cookies?.[AUTH_COOKIES.REFRESH];
    if (typeof token !== 'string') return null;

    try {
      const payload = await this.jwt.verifyAsync<{ jti?: string }>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
      return payload.jti ?? null;
    } catch {
      return null;
    }
  }
}
