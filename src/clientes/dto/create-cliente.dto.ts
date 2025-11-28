import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  num_cliente: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsUUID()
  @IsOptional()
  empleado_id?: string;
}
