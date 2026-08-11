import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

export class CreateCommentRequestDto {
  @ApiProperty({
    type: CreateCommentDto,
  })
  @ValidateNested()
  @Type(() => CreateCommentDto)
  comment!: CreateCommentDto;
}
