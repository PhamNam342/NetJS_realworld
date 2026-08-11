import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateCommentDto {
  @ApiProperty({ example: 'This is greate article!' })
  @IsNotEmpty()
  @IsString()
  body!: string;
}
