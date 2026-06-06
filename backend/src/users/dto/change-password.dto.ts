import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe obligatoire' })
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' })
  @MaxLength(20, { message: 'Le mot de passe ne peut pas dépasser 20 caractères' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[^a-zA-Z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  password: string;
}
