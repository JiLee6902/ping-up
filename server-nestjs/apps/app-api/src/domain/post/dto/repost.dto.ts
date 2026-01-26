import { IsNotEmpty, IsUUID } from 'class-validator';

export class RepostDto {
  @IsUUID("all")
  @IsNotEmpty()
  postId: string;
}
