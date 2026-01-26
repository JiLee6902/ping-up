import { IsUUID } from 'class-validator';

export class ConnectionRequestDto {
  @IsUUID("all")
  userId: string;
}

export class AcceptConnectionDto {
  @IsUUID("all")
  connectionId: string;
}
