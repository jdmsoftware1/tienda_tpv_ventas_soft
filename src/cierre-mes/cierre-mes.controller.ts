import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CierreMesService } from './cierre-mes.service';
import { CreateCierreMesDto } from './dto/create-cierre-mes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('cierre-mes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CierreMesController {
  constructor(private readonly cierreMesService: CierreMesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createCierreMesDto: CreateCierreMesDto) {
    return this.cierreMesService.create(createCierreMesDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.cierreMesService.findAll();
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  getAnalytics(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    return this.cierreMesService.getAnalytics(inicio, fin);
  }

  @Get('current-month')
  getCurrentMonth() {
    return this.cierreMesService.getCurrentMonthStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.cierreMesService.findOne(id);
  }
}
