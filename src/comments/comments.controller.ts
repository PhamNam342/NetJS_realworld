import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentRequestDto } from './dto/create-comment-request.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import type { OptionalAuthenticatedRequest } from 'src/auth/interfaces/optional-authenticated-request.interface';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
@Controller('articles/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('slug') slug: string,
    @Body()
    body: CreateCommentRequestDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    const comment = await this.commentsService.createComment(
      slug,
      body.comment,
      req.user,
    );

    return {
      comment,
    };
  }
  @Get()
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async findCommentsByArticle(
    @Param('slug') slug: string,
    @Req() req: OptionalAuthenticatedRequest,
  ) {
    const comments = await this.commentsService.findCommentsByArticle(
      slug,
      req.user,
    );
    return {
      comments,
    };
  }
  @Delete(':commentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.commentsService.deleteComment(commentId, req.user);
  }
}
