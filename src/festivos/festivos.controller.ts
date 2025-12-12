import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FestivosService } from './festivos.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { TipoFestivo } from '../entities/festivo.entity';

@Controller('festivos')
@UseGuards(RolesGuard)
export class FestivosController {
  constructor(private readonly festivosService: FestivosService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body()
    body: {
      fecha: string;
      nombre: string;
      tipo: TipoFestivo;
      descripcion?: string;
    },
  ) {
    return this.festivosService.create(
      new Date(body.fecha),
      body.nombre,
      body.tipo,
      body.descripcion,
    );
  }

  @Get()
  async findAll(@Query('year') year?: string) {
    if (year) {
      return this.festivosService.findByYear(parseInt(year));
    }
    return this.festivosService.findAll();
  }

  @Get('verify-integrity')
  @Roles(UserRole.ADMIN)
  async verifyIntegrity() {
    const isValid = await this.festivosService.verifyChainIntegrity();
    return {
      valid: isValid,
      message: isValid
        ? 'La cadena de festivos es íntegra'
        : 'Se detectaron alteraciones en los festivos',
    };
  }
}
