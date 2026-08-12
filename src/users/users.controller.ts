import {
  Body,
  Controller,
  Get,
  Put,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { avatarUploadOptions } from '../common/utils/avatar-upload.util';
//cache-constant
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_CONTROL_VALUE = 'no-store, no-cache, must-revalidate';
const CACHE_PRAGMA_HEADER = 'Pragma';
const CACHE_PRAGMA_VALUE = 'no-cache';
const CACHE_EXPIRES_HEADER = 'Expires';
const CACHE_EXPIRES_VALUE = '0';

function antiCacheHeaders(response: Response): void {
  response.setHeader(CACHE_CONTROL_HEADER, CACHE_CONTROL_VALUE);
  response.setHeader(CACHE_PRAGMA_HEADER, CACHE_PRAGMA_VALUE);
  response.setHeader(CACHE_EXPIRES_HEADER, CACHE_EXPIRES_VALUE);
}

@Controller('user')
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  // Lấy thông tin người dùng hiện tại
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Swagger decorator to indicate that this endpoint requires authentication
  getCurrentUser(
    @Request()
    req: AuthenticatedRequest,

    @Res({ passthrough: true })
    res: Response,
  ) {
    // Đặt các header để ngăn trình duyệt lưu cache thông tin người dùng
    antiCacheHeaders(res);
    return new UserResponseDto({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      bio: req.user.bio,
      image: req.user.image,
    });
  }
  // Cập nhật thông tin người dùng hiện tại
  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        bio: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', avatarUploadOptions))
  async updateUser(
    @Request()
    req: AuthenticatedRequest,
    @Body()
    dto: UpdateUserDto,
    @Res({ passthrough: true })
    res: Response,
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    antiCacheHeaders(res);
    const user = await this.userService.updateProfile(req.user.id, dto, file);
    return new UserResponseDto({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      image: user.image,
    });
  }
}
