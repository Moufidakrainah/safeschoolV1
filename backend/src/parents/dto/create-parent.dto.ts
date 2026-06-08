import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, ArrayNotEmpty, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateParentDto {
  @IsString()
  @IsNotEmpty({ message: 'Prénom obligatoire' })
  @Matches(/^[a-zA-ZÀ-ÿ'\-]{2,20}$/, { message: 'Prénom invalide (lettres et tirets, 2-20 caractères)' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom obligatoire' })
  @Matches(/^[a-zA-ZÀ-ÿ'\-]{2,20}$/, { message: 'Nom invalide (lettres et tirets, 2-20 caractères)' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email obligatoire' })
  @MaxLength(50, { message: 'Email trop long' })
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\s]{0,15}$/, { message: 'Téléphone invalide (chiffres, + et espaces, max 15 caractères)' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'Adresse trop longue (max 80 caractères)' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsArray()
  @ArrayNotEmpty()
  studentIds: string[];
}
