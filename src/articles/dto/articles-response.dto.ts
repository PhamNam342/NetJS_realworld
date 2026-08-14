import { ArticleResponseDto } from './article-response.dto';
export class ArticlesResponseDto {
  articles!: ArticleResponseDto[];
  articlesCount!: number;
  constructor(partial: Partial<ArticlesResponseDto>) {
    Object.assign(this, partial);
  }
}
