import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateCierreMesDto {
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: Date;

  @IsDateString()
  @IsNotEmpty()
  fecha_fin: Date;
}
