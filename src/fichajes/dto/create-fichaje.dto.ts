import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { TipoFichaje } from '../../entities/fichaje.entity';

export class CreateFichajeDto {
  @IsNotEmpty()
  @IsString()
  empleadoId: string;

  @IsNotEmpty()
  @IsEnum(TipoFichaje)
  tipo: TipoFichaje;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  token: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
