import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email obligatoire' })
  @MaxLength(50, { message: 'Email trop long' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe obligatoire' })
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' })
  @MaxLength(20, { message: 'Le mot de passe ne peut pas dépasser 20 caractères' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[^a-zA-Z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Prénom obligatoire' })
  @Matches(/^[a-zA-ZÀ-ÿ-]{2,20}$/, { message: 'Prénom invalide (lettres et tirets uniquement, 2-20 caractères)' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom obligatoire' })
  @Matches(/^[a-zA-ZÀ-ÿ-]{2,20}$/, { message: 'Nom invalide (lettres et tirets uniquement, 2-20 caractères)' })
  @Transform(({ value }) => value?.trim())
  lastName: string;
}
