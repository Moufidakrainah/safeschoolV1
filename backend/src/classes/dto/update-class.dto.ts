import { IsString, IsOptional, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @Matches(/^[3-6]eme$/, {
    message: "Le niveau doit être 3eme, 4eme, 5eme ou 6eme",
  })
  @Transform(({ value }: { value?: string }) => value?.trim())
  level?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]$/, {
    message: "La section doit être une seule lettre majuscule (A, B, C...)",
  })
  @Transform(({ value }: { value?: string }) => value?.trim().toUpperCase())
  section?: string;
}
