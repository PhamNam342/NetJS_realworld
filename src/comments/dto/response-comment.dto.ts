import { ProfileResponseDto } from 'src/users/dto/profile-response.dto';

export class CommentResponseDto {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  body!: string;
  author!: ProfileResponseDto;

  constructor(partial: Partial<CommentResponseDto>) {
    Object.assign(this, partial);
  }
}
