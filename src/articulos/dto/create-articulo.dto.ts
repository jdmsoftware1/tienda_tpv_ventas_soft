import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateArticuloDto {
  @IsString()
  @IsNotEmpty()
  codigo_barras: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsPositive()
  precio_compra: number;

  @IsNumber()
  @IsPositive()
  precio_venta: number;

  @IsNumber()
  cantidad: number;
}
