import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsPositive } from 'class-validator';

export class CreateDevolucionDto {
  @IsUUID()
  @IsNotEmpty()
  cliente_id: string;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
