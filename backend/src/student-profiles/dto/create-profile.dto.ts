import { IsString, IsOptional } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}
