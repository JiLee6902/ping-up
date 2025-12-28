import { IsUUID } from 'class-validator';

export class ConnectionRequestDto {
  @IsUUID()
  userId: string;
}

export class AcceptConnectionDto {
  @IsUUID()
  connectionId: string;
}
