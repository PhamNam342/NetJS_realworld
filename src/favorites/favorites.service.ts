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
}
