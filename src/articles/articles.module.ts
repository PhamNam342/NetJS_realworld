import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { FollowsModule } from 'src/follows/follows.module';
import { User } from 'src/users/entities/user.entity';
import { FavoritesModule } from 'src/favorites/favorites.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Article, User]),
    FollowsModule,
    FavoritesModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
