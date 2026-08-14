import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { UpdateArticleDto } from './update-article.dto';

export class UpdateArticleRequestDto {
  @ApiProperty({
    type: UpdateArticleDto,
  })
  @ValidateNested()
  @Type(() => UpdateArticleDto)
  article!: UpdateArticleDto;
}
