import { IsString, IsNotEmpty, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class CreateClassDto {
  @IsString()
  @IsNotEmpty({ message: "Le niveau est obligatoire" })
  @Matches(/^[3-6]eme$/, {
    message: "Le niveau doit être 3eme, 4eme, 5eme ou 6eme",
  })
  @Transform(({ value }) => value?.trim())
  level: string;

  @IsString()
  @IsNotEmpty({ message: "La section est obligatoire" })
  @Matches(/^[A-Z]$/, {
    message: "La section doit être une seule lettre majuscule (A, B, C...)",
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  section: string;
}
