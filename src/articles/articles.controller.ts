import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { UpdateArticleRequestDto } from './dto/update-article-request.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';
import type { OptionalAuthenticatedRequest } from 'src/auth/interfaces/optional-authenticated-request.interface';
import { CreateArticleRequestDto } from './dto/create-article-request.dto';
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createArticle(
    @Body()
    body: CreateArticleRequestDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.createArticle(
      body.article,
      req.user,
    );

    return {
      article,
    };
  }
  // GET /api/articles
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiQuery({
    name: 'tag',
    required: false,
    example: 'nestjs',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    example: 'nam',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
  })
  async findAll(
    @Query()
    query: ArticleQueryDto,

    @Req()
    req: OptionalAuthenticatedRequest,
  ) {
    return this.articlesService.findAll(query, req.user);
  }
  // GET /api/articles/feed
  @Get('feed')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
  })
  async getFeed(
    @Req()
    req: AuthenticatedRequest,

    @Query()
    query: FeedQueryDto,
  ) {
    return this.articlesService.getFeed(req.user, query);
  }
  // GET /api/articles/:slug

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('slug')
    slug: string,

    @Req()
    req: OptionalAuthenticatedRequest,
  ) {
    const article = await this.articlesService.findOne(slug, req.user);

    return {
      article,
    };
  }
  // PUT /api/articles/:slug
  @Put(':slug')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json')
  async updateArticle(
    contentType: string,

    @Param('slug')
    slug: string,

    @Body()
    body: UpdateArticleRequestDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.updateArticle(
      slug,
      body.article,
      req.user,
    );

    return {
      article,
    };
  }
  @Delete(':slug')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArticle(
    @Param('slug')
    slug: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    await this.articlesService.deleteArticle(slug, req.user);
  }
  // POST /api/articles/:slug/favorite
  @Post(':slug/favorite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async favoriteArticle(
    @Param('slug')
    slug: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.favoriteArticle(slug, req.user);

    return {
      article,
    };
  }
  // DELETE /api/articles/:slug/favorite
  @Delete(':slug/favorite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async unfavoriteArticle(
    @Param('slug')
    slug: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.unfavoriteArticle(
      slug,
      req.user,
    );
    return {
      article,
    };
  }
}
