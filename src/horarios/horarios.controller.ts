import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { DiaSemana } from '../entities/horario.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('horarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Post('empleado/:id/semana')
  @Roles(UserRole.ADMIN)
  async setHorarioSemanal(
    @Param('id') empleadoId: string,
    @Body()
    body: {
      anio: number;
      numero_semana: number;
      horarios: Array<{
        dia_semana: DiaSemana;
        hora_entrada_manana?: string;
        hora_salida_manana?: string;
        hora_entrada_tarde?: string;
        hora_salida_tarde?: string;
        es_dia_libre?: boolean;
      }>;
      plantilla_horaria_id?: string;
    },
  ) {
    return this.horariosService.setHorarioSemanal(
      empleadoId,
      body.anio,
      body.numero_semana,
      body.horarios,
      body.plantilla_horaria_id,
    );
  }

  @Post('empleado/:id/copiar')
  @Roles(UserRole.ADMIN)
  async copiarHorario(
    @Param('id') empleadoId: string,
    @Body()
    body: {
      anio_origen: number;
      semana_origen: number;
      anio_destino: number;
      semana_destino: number;
    },
  ) {
    return this.horariosService.copiarHorario(
      empleadoId,
      body.anio_origen,
      body.semana_origen,
      body.anio_destino,
      body.semana_destino,
    );
  }

  @Get('empleado/:id')
  async getHorarioEmpleado(
    @Param('id') empleadoId: string,
    @Query('anio') anio?: string,
  ) {
    return this.horariosService.getHorarioEmpleado(
      empleadoId,
      anio ? parseInt(anio) : undefined,
    );
  }

  @Get('empleado/:id/semana/:anio/:numero')
  async getHorarioSemana(
    @Param('id') empleadoId: string,
    @Param('anio') anio: string,
    @Param('numero') numero: string,
  ) {
    return this.horariosService.getHorarioSemana(
      empleadoId,
      parseInt(anio),
      parseInt(numero),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllHorarios() {
    return this.horariosService.getAllHorarios();
  }

  @Get('verify-integrity')
  @Roles(UserRole.ADMIN)
  async verifyIntegrity() {
    const isValid = await this.horariosService.verifyChainIntegrity();
    return {
      valid: isValid,
      message: isValid
        ? 'La cadena de horarios es íntegra'
        : 'Se detectaron alteraciones en los horarios',
    };
  }
}
