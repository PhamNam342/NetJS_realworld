import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class FeedQueryDto {
  @ApiPropertyOptional({
    example: 20,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    example: 0,
  })
  @IsOptional()
  @IsNumberString()
  offset?: string;
}
