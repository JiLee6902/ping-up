import { IsNotEmpty, IsUUID } from 'class-validator';

export class RepostDto {
  @IsUUID()
  @IsNotEmpty()
  postId: string;
}
