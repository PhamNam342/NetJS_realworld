import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

export class CreateArticleRequestDto {
  @ApiProperty({
    type: CreateArticleDto,
  })
  @ValidateNested()
  @Type(() => CreateArticleDto)
  article!: CreateArticleDto;
}
