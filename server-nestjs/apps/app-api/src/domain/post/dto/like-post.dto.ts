import { IsUUID } from 'class-validator';

export class LikePostDto {
  @IsUUID("all")
  postId: string;
}
