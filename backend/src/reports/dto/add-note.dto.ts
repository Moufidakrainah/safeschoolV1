import { IsString, IsOptional } from 'class-validator';

export class AddNoteDto {
  @IsString()
  content: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  personId?: string;
}
