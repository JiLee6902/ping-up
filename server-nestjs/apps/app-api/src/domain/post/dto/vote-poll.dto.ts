import { IsUUID, IsInt, Min } from 'class-validator';

export class VotePollDto {
  @IsUUID()
  pollId: string;

  @IsInt()
  @Min(0)
  optionId: number;
}
