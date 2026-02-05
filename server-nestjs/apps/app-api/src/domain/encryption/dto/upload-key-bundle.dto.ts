import { IsString, IsOptional } from 'class-validator';

export class UploadKeyBundleDto {
  @IsString()
  identityPublicKey: string;

  @IsOptional()
  @IsString()
  signedPrekey?: string;

  @IsOptional()
  @IsString()
  prekeySignature?: string;
}
