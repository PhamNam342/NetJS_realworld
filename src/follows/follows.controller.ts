import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';

import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('profiles')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}
  // GET /api/profiles/:username
  @Get(':username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(
    @Param('username') username: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const currentUserId = req?.user?.id ?? null;
    const profile = await this.followsService.findProfile(
      username,
      currentUserId,
    );

    return {
      profile,
    };
  }
  // POST /api/profiles/:username/follow
  @Post(':username/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async follow(
    @Param('username') username: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const profile = await this.followsService.follow(req.user.id, username);

    return {
      profile,
    };
  }
  // DELETE /api/profiles/:username/follow
  @Delete(':username/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @Param('username') username: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const profile = await this.followsService.unfollow(req.user.id, username);

    return {
      profile,
    };
  }
}
