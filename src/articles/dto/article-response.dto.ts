import { ProfileResponseDto } from 'src/users/dto/profile-response.dto';

export class ArticleResponseDto {
  slug!: string;
  title!: string;
  description!: string;
  body!: string;
  tagList!: string[];
  createdAt!: Date;
  updatedAt!: Date;
  favorited!: boolean;
  favoritesCount!: number;
  author!: ProfileResponseDto;
  constructor(partial: Partial<ArticleResponseDto>) {
    Object.assign(this, partial);
  }
}
