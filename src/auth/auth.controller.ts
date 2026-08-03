import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Đăng ký tài khoản mới
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Đăng nhập và trả về JWT token
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Đăng xuất và thu hồi token hiện tại
  @ApiBearerAuth()
  @Post('logout')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @UseGuards(JwtAuthGuard)
  logout(@Request() req: AuthenticatedRequest) {
    return this.authService.endSession(req.user);
  }
}
