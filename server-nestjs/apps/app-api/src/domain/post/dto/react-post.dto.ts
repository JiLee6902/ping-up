import { IsEnum, IsUUID } from 'class-validator';
import { ReactionType } from '@app/enum';

export class ReactPostDto {
  @IsUUID()
  postId: string;

  @IsEnum(ReactionType)
  reactionType: ReactionType;
}
