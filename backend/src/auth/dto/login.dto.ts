import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email obligatoire' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe obligatoire' })
  @MinLength(6, { message: 'Mot de passe trop court' })
  password: string;
}
