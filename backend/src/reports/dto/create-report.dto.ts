import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  MaxLength,
  MinLength,
  IsIn,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

class PersonDto {
  @IsString()
  @MinLength(2, { message: "Le nom doit contenir au moins 2 caractères" })
  @MaxLength(50, { message: "Le nom ne peut pas dépasser 50 caractères" })
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  @Matches(/^(?!(.)\1{4,})[\p{L}\s\-']+$/u, {
    message: "Le nom contient des caractères invalides ou répétitifs",
  })
  freeText: string;
}

export class CreateReportDto {
  @IsString()
  @IsIn(["physique", "verbal", "cyber", "exclusion", "sexuel"], {
    message: "Type de signalement invalide",
  })
  type: string;

  @IsString()
  @IsIn(["victime", "temoin"], { message: "Reporter invalide" })
  reporter: string;

  @IsString()
  @MinLength(20, {
    message: "La description doit contenir au moins 20 caractères",
  })
  @MaxLength(2000, {
    message: "La description ne peut pas dépasser 2000 caractères",
  })
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  @Matches(/^(?!(.)\1{9,})[\s\S]+$/u, {
    message: "La description semble invalide (caractères répétitifs détectés)",
  })
  description: string;

  @IsBoolean()
  isAnonymous: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: "Maximum 5 suspects autorisés" })
  @ValidateNested({ each: true })
  @Type(() => PersonDto)
  suspects?: PersonDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: "Maximum 5 suspects autorisés" })
  @ValidateNested({ each: true })
  @Type(() => PersonDto)
  victims?: PersonDto[];

  @IsOptional()
  @IsString()
  @IsIn(["Une fois", "Deux fois", "Trois fois ou plus", "Tous les jours"], {
    message: "Fréquence invalide",
  })
  frequency?: string;
}
