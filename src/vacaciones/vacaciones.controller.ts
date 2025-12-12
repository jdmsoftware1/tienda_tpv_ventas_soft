import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VacacionesService } from './vacaciones.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('vacaciones')
@UseGuards(RolesGuard)
export class VacacionesController {
  constructor(private readonly vacacionesService: VacacionesService) {}

  @Post('solicitar')
  async solicitar(
    @Body()
    body: {
      empleadoId: string;
      fecha_inicio: string;
      fecha_fin: string;
      motivo?: string;
    },
  ) {
    return this.vacacionesService.solicitar(
      body.empleadoId,
      new Date(body.fecha_inicio),
      new Date(body.fecha_fin),
      body.motivo,
    );
  }

  @Patch(':id/aprobar')
  @Roles(UserRole.ADMIN)
  async aprobar(
    @Param('id') id: string,
    @Body() body: { observaciones?: string },
    @Req() req: any,
  ) {
    return this.vacacionesService.aprobar(id, req.user.id, body.observaciones);
  }

  @Patch(':id/rechazar')
  @Roles(UserRole.ADMIN)
  async rechazar(
    @Param('id') id: string,
    @Body() body: { observaciones: string },
    @Req() req: any,
  ) {
    return this.vacacionesService.rechazar(id, req.user.id, body.observaciones);
  }

  @Get('empleado/:id')
  async findByEmpleado(@Param('id') empleadoId: string) {
    return this.vacacionesService.findByEmpleado(empleadoId);
  }

  @Get('pendientes')
  @Roles(UserRole.ADMIN)
  async findPendientes() {
    return this.vacacionesService.findPendientes();
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.vacacionesService.findAll();
  }

  @Get('verify-integrity')
  @Roles(UserRole.ADMIN)
  async verifyIntegrity() {
    const isValid = await this.vacacionesService.verifyChainIntegrity();
    return {
      valid: isValid,
      message: isValid
        ? 'La cadena de vacaciones es íntegra'
        : 'Se detectaron alteraciones en las vacaciones',
    };
  }
}
