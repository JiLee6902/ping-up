import { IsUUID } from 'class-validator';

export class LikePostDto {
  @IsUUID()
  postId: string;
}
