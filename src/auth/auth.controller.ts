import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
// Cache constant
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_CONTROL_VALUE = 'no-store, no-cache, must-revalidate';
const PRAGMA_HEADER = 'Pragma';
const PRAGMA_VALUE = 'no-cache';
const EXPIRES_HEADER = 'Expires';
const EXPIRES_VALUE = '0';

function antiCacheHeaders(response: Response): void {
  response.setHeader(CACHE_CONTROL_HEADER, CACHE_CONTROL_VALUE);
  response.setHeader(PRAGMA_HEADER, PRAGMA_VALUE);
  response.setHeader(EXPIRES_HEADER, EXPIRES_VALUE);
}

type SessionRequest = Request & {
  session?: {
    destroy(callback: (error?: unknown) => void): void;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(
    @Body()
    dto: RegisterDto,
    // Ghi nhận các header để ngăn trình duyệt cache dữ liệu
    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    antiCacheHeaders(response);
    return this.authService.register(dto);
  }
  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  login(
    @Body()
    dto: LoginDto,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    antiCacheHeaders(response);
    return this.authService.login(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req()
    req: SessionRequest,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    // Ghi nhận các header để ngăn trình duyệt cache dữ liệu
    antiCacheHeaders(response);
    if (req.session) {
      req.session.destroy(() => undefined);
    }
    return this.authService.endSession(
      req.user as AuthenticatedRequest['user'],
    );
  }
}
