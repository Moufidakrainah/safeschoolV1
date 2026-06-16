import { IsString, IsOptional, IsArray } from "class-validator";

export class CreateStaffProfileDto {
  @IsString()
  userId: string;

  @IsString()
  profession: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];
}
