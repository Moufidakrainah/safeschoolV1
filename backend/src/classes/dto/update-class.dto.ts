import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le niveau doit contenir au moins 2 caractères' })
  @MaxLength(10, { message: 'Le niveau ne peut pas dépasser 10 caractères' })
  @Transform(({ value }) => value?.trim())
  level?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'La section doit contenir au moins 1 caractère' })
  @MaxLength(2, { message: 'La section ne peut pas dépasser 2 caractères' })
  @Transform(({ value }) => value?.trim())
  section?: string;
}
