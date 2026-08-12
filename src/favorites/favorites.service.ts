import { Injectable } from '@nestjs/common';
import { Favorite } from './entities/favorite.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
  ) {}
  async addFavorite(userId: string, articleId: string) {
    const favorite = this.favoriteRepository.create({
      userId,
      articleId,
    });

    return this.favoriteRepository.save(favorite);
  }
  // Tính số lượt thích
  async countFavorites(articleId: string) {
    return this.favoriteRepository.count({
      where: {
        articleId,
      },
    });
  }
  async isFavorited(userId: string, articleId: string) {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        userId,
        articleId,
      },
    });

    return Boolean(favorite);
  }
  async removeFavorite(userId: string, articleId: string) {
    await this.favoriteRepository.delete({
      userId,
      articleId,
    });
  }
  async findFavoritedArticleIds(
    userId: string,
    articleIds: string[],
  ): Promise<string[]> {
    if (articleIds.length === 0) {
      return [];
    }

    const favorites = await this.favoriteRepository.find({
      where: articleIds.map((articleId) => ({
        userId,
        articleId,
      })),
    });

    return favorites.map((favorite) => favorite.articleId);
  }

  async countFavoritesByArticleIds(
    articleIds: string[],
  ): Promise<Map<string, number>> {
    if (articleIds.length === 0) {
      return new Map();
    }

    const rows = await this.favoriteRepository
      .createQueryBuilder('favorite')
      .select('favorite.articleId', 'articleId')
      .addSelect('COUNT(*)', 'count')
      .where('favorite.articleId IN (:...articleIds)', { articleIds })
      .groupBy('favorite.articleId')
      .getRawMany<{ articleId: string; count: string }>();

    return new Map(rows.map((row) => [row.articleId, Number(row.count)]));
  }
}
