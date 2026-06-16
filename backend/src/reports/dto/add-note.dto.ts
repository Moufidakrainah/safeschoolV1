import { IsString, IsOptional, Matches, MaxLength } from "class-validator";

export class AddNoteDto {
  @IsString()
  @MaxLength(1500, {
    message: "Le contenu ne peut pas dépasser 1500 caractères",
  })
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  content: string;

  @IsString()
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  type: string;

  @IsOptional()
  @IsString()
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  targetRole?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[^\x00]*$/, {
    message: "Le champ contient des caractères invalides",
  })
  personId?: string;
}
