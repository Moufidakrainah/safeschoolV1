import { IsString, IsOptional, Matches, MaxLength } from "class-validator";
import { NO_NULL_BYTE } from "../../utils/validation-patterns";

export class AddNoteDto {
  @IsString()
  @MaxLength(1500, {
    message: "Le contenu ne peut pas dépasser 1500 caractères",
  })
  @Matches(NO_NULL_BYTE, {
    message: "Le champ contient des caractères invalides",
  })
  content: string;

  @IsString()
  @Matches(NO_NULL_BYTE, {
    message: "Le champ contient des caractères invalides",
  })
  type: string;

  @IsOptional()
  @IsString()
  @Matches(NO_NULL_BYTE, {
    message: "Le champ contient des caractères invalides",
  })
  targetRole?: string;

  @IsOptional()
  @IsString()
  @Matches(NO_NULL_BYTE, {
    message: "Le champ contient des caractères invalides",
  })
  personId?: string;
}
