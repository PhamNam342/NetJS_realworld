import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
};

export class UpdateUserDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  username?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  bio?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MinLength(6)
  password?: string;
}
