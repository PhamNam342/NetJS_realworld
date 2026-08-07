import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
export class ArticleQueryDto {
  @ApiPropertyOptional({
    description: 'Filter articles by tag',
    example: 'nestjs',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Filter articles by author username',
    example: 'nam',
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({
    description: 'Filter articles favorited by user',
    example: 'jake',
  })
  @IsOptional()
  @IsString()
  favorited?: string;

  @ApiPropertyOptional({
    description: 'Number of articles returned',
    example: 20,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Number of articles skipped',
    example: 0,
  })
  @IsOptional()
  @IsNumberString()
  offset?: string;
}
