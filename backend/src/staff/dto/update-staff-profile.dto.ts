import { IsString, IsOptional, IsArray } from "class-validator";

export class UpdateStaffProfileDto {
  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];
}
