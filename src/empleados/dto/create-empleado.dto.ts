import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  id_empleado: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}
