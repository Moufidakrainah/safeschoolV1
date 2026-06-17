import {
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  Matches,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class UpdateParentDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-ZÀ-ÿ'-]{2,20}$/, {
    message: "Prénom invalide (lettres et tirets, 2-20 caractères)",
  })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-ZÀ-ÿ'-]{2,20}$/, {
    message: "Nom invalide (lettres et tirets, 2-20 caractères)",
  })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email invalide" })
  @MaxLength(50, { message: "Email trop long" })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  @Matches(/^[0-9+\s]{0,15}$/, {
    message: "Téléphone invalide (chiffres, + et espaces, max 15 caractères)",
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  @MaxLength(80, { message: "Adresse trop longue (max 80 caractères)" })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsOptional()
  @IsArray()
  studentIds?: string[];
}
