import { IsOptional, IsString } from 'class-validator';

export class ResolveUserDto {
  @IsOptional()
  @IsString()
  resolvedUserId: string | null;
}
