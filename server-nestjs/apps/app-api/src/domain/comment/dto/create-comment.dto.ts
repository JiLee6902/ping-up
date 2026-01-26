import { IsNotEmpty, IsString, IsUUID, MaxLength, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsUUID("all")
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;

  @IsUUID("all")
  @IsOptional()
  parentId?: string;
}
