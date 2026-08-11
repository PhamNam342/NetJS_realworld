import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { FollowsModule } from '../follows/follows.module';
@Module({
  imports: [TypeOrmModule.forFeature([Comment, Article, User]), FollowsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
