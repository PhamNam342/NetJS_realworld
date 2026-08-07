import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { ArticlesResponseDto } from './dto/articles-response.dto';
import { User } from 'src/users/entities/user.entity';
import { ProfileResponseDto } from 'src/users/dto/profile-response.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { FollowsService } from 'src/follows/follows.service';
import { FavoritesService } from 'src/favorites/favorites.service';
@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly followsService: FollowsService,
    private readonly favoritesService: FavoritesService,
    private readonly i18n: I18nService,
  ) {}

  async createArticle(
    dto: CreateArticleDto,
    authUser: AuthenticatedUser,
  ): Promise<ArticleResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        id: authUser.id,
      },
    });
    if (!user) {
      throw new NotFoundException(this.i18n.t('articles.userNotFound'));
    }

    const slug = dto.title.toLowerCase().replaceAll(/ /g, '-');
    // trường hợp chung slug
    const existedArticle = await this.articleRepository.findOne({
      where: {
        slug,
      },
    });

    if (existedArticle) {
      throw new ConflictException(this.i18n.t('articles.slugAlreadyExists'));
    }
    const article = this.articleRepository.create({
      slug,
      title: dto.title,
      description: dto.description,
      body: dto.body,
      tagList: dto.tagList ?? [],
      author: user,
    });

    const savedArticle = await this.articleRepository.save(article);
    return this.mapArticleToResponse(savedArticle, authUser);
  }

  async findAll(
    query: ArticleQueryDto,
    authUser?: AuthenticatedUser,
  ): Promise<ArticlesResponseDto> {
    const limit = Math.min(Number(query.limit ?? 20), 100);

    const offset = Math.max(Number(query.offset ?? 0), 0);
    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author');

    // filter tag
    if (query.tag) {
      qb.andWhere(':tag = ANY(article.tagList)', {
        tag: query.tag,
      });
    }

    // filter author
    if (query.author) {
      qb.andWhere('author.username = :author', {
        author: query.author,
      });
    }

    qb.orderBy('article.createdAt', 'DESC');
    qb.take(limit);
    qb.skip(offset);
    const [articles, count] = await qb.getManyAndCount();
    const articleResponses = await Promise.all(
      articles.map((article) => this.mapArticleToResponse(article, authUser)),
    );

    return new ArticlesResponseDto({
      articles: articleResponses,

      articlesCount: count,
    });
  }
  async getFeed(
    authUser: AuthenticatedUser,

    query: ArticleQueryDto,
  ): Promise<ArticlesResponseDto> {
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const offset = Math.max(Number(query.offset ?? 0), 0);
    const followingIds = await this.followsService.getFollowingIds(authUser.id);

    if (followingIds.length === 0) {
      return new ArticlesResponseDto({
        articles: [],

        articlesCount: 0,
      });
    }

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author');

    qb.where('article.author_id IN (:...ids)', {
      ids: followingIds,
    });

    qb.orderBy('article.createdAt', 'DESC');
    qb.take(limit);
    qb.skip(offset);
    const [articles, count] = await qb.getManyAndCount();
    const articleResponses = await Promise.all(
      articles.map((article) => this.mapArticleToResponse(article, authUser)),
    );

    return new ArticlesResponseDto({
      articles: articleResponses,

      articlesCount: count,
    });
  }
  async updateArticle(
    slug: string,

    dto: UpdateArticleDto,

    authUser: AuthenticatedUser,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },

      relations: {
        author: true,
      },
    });

    if (!article) {
      throw new NotFoundException(this.i18n.t('articles.notFound'));
    }

    if (article.author.id !== authUser.id) {
      throw new ForbiddenException(this.i18n.t('articles.notAuthor'));
    }

    if (dto.title) {
      const newSlug = dto.title.toLowerCase().replaceAll(/ /g, '-');
      const existedArticle = await this.articleRepository.findOne({
        where: {
          slug: newSlug,
        },
      });
      if (existedArticle && existedArticle.id !== article.id) {
        throw new ConflictException(this.i18n.t('articles.slugAlreadyExists'));
      }
      article.title = dto.title;
      article.slug = dto.title.toLowerCase().replaceAll(/ /g, '-');
    }
    if (dto.description) {
      article.description = dto.description;
    }
    if (dto.body) {
      article.body = dto.body;
    }

    await this.articleRepository.save(article);
    return this.mapArticleToResponse(article, authUser);
  }
  async deleteArticle(
    slug: string,

    authUser: AuthenticatedUser,
  ): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },

      relations: {
        author: true,
      },
    });

    if (!article) {
      throw new NotFoundException(this.i18n.t('articles.notFound'));
    }

    if (article.author.id !== authUser.id) {
      throw new ForbiddenException(this.i18n.t('articles.notAuthor'));
    }

    await this.articleRepository.remove(article);
  }
  // GET /api/articles/:slug
  async findOne(
    slug: string,
    authUser?: AuthenticatedUser,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },
      relations: {
        author: true,
      },
    });

    if (!article) {
      throw new NotFoundException(this.i18n.t('articles.notFound'));
    }

    return this.mapArticleToResponse(article, authUser);
  }
  async favoriteArticle(
    slug: string,

    authUser: AuthenticatedUser,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },

      relations: {
        author: true,
      },
    });

    if (!article) {
      throw new NotFoundException(this.i18n.t('articles.notFound'));
    }

    await this.favoritesService.addFavorite(authUser.id, article.id);
    return this.mapArticleToResponse(article, authUser);
  }
  async unfavoriteArticle(
    slug: string,
    authUser: AuthenticatedUser,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },

      relations: {
        author: true,
      },
    });

    if (!article) {
      throw new NotFoundException(this.i18n.t('articles.notFound'));
    }

    await this.favoritesService.removeFavorite(
      authUser.id,

      article.id,
    );

    return this.mapArticleToResponse(article, authUser);
  }
  // RESPONSE MAPPER

  private async mapArticleToResponse(
    article: Article,
    authUser?: AuthenticatedUser,
  ): Promise<ArticleResponseDto> {
    let isfollowing = false;

    if (authUser) {
      isfollowing = await this.followsService.isFollowing(
        authUser.id,
        article.author.id,
      );
    }

    let isfavorited = false;
    if (authUser) {
      isfavorited = await this.favoritesService.isFavorited(
        authUser.id,
        article.id,
      );
    }

    const favoritesCount = await this.favoritesService.countFavorites(
      article.id,
    );

    return new ArticleResponseDto({
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList ?? [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: isfavorited,
      favoritesCount,
      author: new ProfileResponseDto({
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: isfollowing,
      }),
    });
  }
}
