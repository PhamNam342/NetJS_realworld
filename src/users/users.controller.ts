import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('user')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  getCurrentUser(@Request() req: AuthenticatedRequest) {
    return {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        bio: req.user.bio,
        image: req.user.image,
      },
    };
  }
}
