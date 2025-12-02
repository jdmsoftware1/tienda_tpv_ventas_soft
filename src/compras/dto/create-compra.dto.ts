import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CompraArticuloDto {
  @IsUUID()
  articulo_id: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio_unitario: number;
}

export class CreateCompraDto {
  @IsUUID()
  @IsNotEmpty()
  cliente_id: string;

  @IsNumber()
  @IsOptional()
  total?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  es_varios?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraArticuloDto)
  @IsOptional()
  articulos?: CompraArticuloDto[];
}
