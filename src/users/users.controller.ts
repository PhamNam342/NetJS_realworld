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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { AttachmentsService } from '../attachments/attachments.service';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

//cache-constant
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_CONTROL_VALUE = 'no-store, no-cache, must-revalidate';
const CACHE_PRAGMA_HEADER = 'Pragma';
const CACHE_PRAGMA_VALUE = 'no-cache';
const CACHE_EXPIRES_HEADER = 'Expires';
const CACHE_EXPIRES_VALUE = '0';
const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;
const IMAGE_MIME_PREFIX = 'image/';
const ATTACHABLE_TYPE_USER = 'USER';

function antiCacheHeaders(response: Response): void {
  response.setHeader(CACHE_CONTROL_HEADER, CACHE_CONTROL_VALUE);
  response.setHeader(CACHE_PRAGMA_HEADER, CACHE_PRAGMA_VALUE);
  response.setHeader(CACHE_EXPIRES_HEADER, CACHE_EXPIRES_VALUE);
}

@Controller('user')
export class UsersController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly userService: UsersService,
  ) {}
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
  @UseInterceptors(
    FileInterceptor(
      'file',

      {
        storage: diskStorage({
          destination: './public/uploads/avatar',

          filename(req, file, callback) {
            const extension = extname(file.originalname);
            // Đặt tên tệp tin là một UUID ngẫu nhiên để tránh trùng lặp
            const filename = `${randomUUID()}${extension}`;
            callback(null, filename);
          },
        }),

        limits: {
          fileSize: MAX_AVATAR_SIZE_BYTES,
        },

        fileFilter(req, file, callback) {
          if (!file.mimetype.startsWith(IMAGE_MIME_PREFIX)) {
            return callback(null, false); // từ chối tệp tin nếu không phải là hình ảnh
          }

          callback(null, true);
        },
      },
    ),
  )
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
    const userId = req.user.id;
    const updateData: Partial<User> = {
      ...dto,
    };
    // Update password
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    // Upload avatar

    if (file) {
      const attachment = await this.attachmentsService.create({
        fileName: file.filename,
        fileType: file.mimetype,
        fileSize: file.size,
        url: `/uploads/avatar/${file.filename}`,
        attachableId: userId,
        attachableType: ATTACHABLE_TYPE_USER,
      });

      updateData.image = attachment.url;
    }
    const user = await this.userService.update(userId, updateData);
    return new UserResponseDto({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      image: user.image,
    });
  }
}
