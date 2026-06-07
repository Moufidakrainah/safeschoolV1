import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PersonDto {
  @IsString()
  freeText: string;
}

export class CreateReportDto {
  @IsString()
  type: string;

  @IsString()
  reporter: string;

  @IsString()
  description: string;

  @IsBoolean()
  isAnonymous: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonDto)
  suspects?: PersonDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonDto)
  victims?: PersonDto[];

  @IsOptional()
  @IsString()
  frequency?: string;
}
