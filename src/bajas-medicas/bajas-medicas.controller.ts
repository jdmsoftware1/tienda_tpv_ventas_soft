import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BajasMedicasService } from './bajas-medicas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { TipoBajaMedica } from '../entities/baja-medica.entity';

@Controller('bajas-medicas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BajasMedicasController {
  constructor(private readonly bajasService: BajasMedicasService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body()
    body: {
      empleadoId: string;
      fecha_inicio: Date;
      fecha_fin: Date;
      tipo: TipoBajaMedica;
      diagnostico?: string;
      observaciones?: string;
      documento_justificativo?: string;
    },
  ) {
    return await this.bajasService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return await this.bajasService.findAll();
  }

  @Get('activas')
  async findActivas() {
    return await this.bajasService.findActivas();
  }

  @Get('empleado/:id')
  async findByEmpleado(@Param('id') id: string) {
    return await this.bajasService.findByEmpleado(id);
  }

  @Get('verify-integrity')
  @Roles(UserRole.ADMIN)
  async verifyIntegrity() {
    return await this.bajasService.verifyIntegrity();
  }
}
