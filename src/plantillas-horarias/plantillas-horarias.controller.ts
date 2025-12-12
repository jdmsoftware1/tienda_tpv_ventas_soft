import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PlantillasHorariasService } from './plantillas-horarias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('plantillas-horarias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlantillasHorariasController {
  constructor(
    private readonly plantillasService: PlantillasHorariasService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body()
    body: {
      nombre: string;
      descripcion?: string;
      horarios: any[];
    },
  ) {
    return await this.plantillasService.create(body);
  }

  @Get()
  async findAll() {
    return await this.plantillasService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.plantillasService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.plantillasService.remove(id);
    return { message: 'Plantilla eliminada correctamente' };
  }

  @Get('verify-integrity/all')
  @Roles(UserRole.ADMIN)
  async verifyIntegrity() {
    return await this.plantillasService.verifyIntegrity();
  }
}
