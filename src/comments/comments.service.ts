import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { Comment } from './entities/comment.entity';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { FollowsService } from '../follows/follows.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/response-comment.dto';
import { ProfileResponseDto } from '../users/dto/profile-response.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly followsService: FollowsService,
    private readonly i18n: I18nService,
  ) {}

  // Tạo comment
  async createComment(
    slug: string,
    dto: CreateCommentDto,
    authUser: AuthenticatedUser,
  ): Promise<CommentResponseDto> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },
    });

    if (!article) {
      throw new NotFoundException(this.i18n.t('comment.ArticleNotFound'));
    }

    const user = await this.userRepository.findOne({
      where: {
        id: authUser.id,
      },
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('comment.UserNotFound'));
    }
    const comment = this.commentRepository.create({
      body: dto.body,
      article,
      author: user,
    });
    const savedComment = await this.commentRepository.save(comment);
    const result = await this.commentRepository.findOne({
      where: {
        id: savedComment.id,
      },
      relations: {
        author: true,
      },
    });

    if (!result) {
      throw new NotFoundException(this.i18n.t('comment.CommentNotFound'));
    }
    // Kiểm tra following trước khi return
    const following = await this.followsService.isFollowing(
      authUser.id,
      result.author.id,
    );
    return new CommentResponseDto({
      id: result.id,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      body: result.body,
      author: new ProfileResponseDto({
        username: result.author.username,
        bio: result.author.bio,
        image: result.author.image,
        following,
      }),
    });
  }

  // Tìm tất cả comments
  async findCommentsByArticle(
    slug: string,
    authUser?: AuthenticatedUser,
  ): Promise<CommentResponseDto[]> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },
    });
    if (!article) {
      throw new NotFoundException(this.i18n.t('comment.ArticleNotFound'));
    }
    const comments = await this.commentRepository.find({
      where: {
        article: {
          id: article.id,
        },
      },
      relations: {
        author: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
    // Lặp qua từng commment lọc following
    return Promise.all(
      comments.map(async (comment) => {
        const isfollowing = authUser
          ? await this.followsService.isFollowing(
              authUser.id,
              comment.author.id,
            )
          : false;
        return new CommentResponseDto({
          id: comment.id,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          body: comment.body,
          author: new ProfileResponseDto({
            username: comment.author.username,
            bio: comment.author.bio,
            image: comment.author.image,
            following: isfollowing,
          }),
        });
      }),
    );
  }

  // Xoá comment
  async deleteComment(
    commentId: string,
    authUser: AuthenticatedUser,
  ): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: {
        id: commentId,
      },
      relations: {
        author: true,
      },
    });
    if (!comment) {
      throw new NotFoundException(this.i18n.t('comment.CommentNotFound'));
    }
    if (comment.author.id !== authUser.id) {
      throw new ForbiddenException(
        this.i18n.t('comment.YouCanOnlyDeleteYourOwnComments'),
      );
    }
    await this.commentRepository.remove(comment);
  }
}
