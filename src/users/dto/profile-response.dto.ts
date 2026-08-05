export class ProfileResponseDto {
  username!: string;
  bio!: string | null;
  image!: string | null;
  following!: boolean;

  constructor(partial: Partial<ProfileResponseDto>) {
    Object.assign(this, partial);
  }
}
