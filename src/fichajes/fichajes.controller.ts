import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FichajesService } from './fichajes.service';
import { CreateFichajeDto } from './dto/create-fichaje.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

@Controller('fichajes')
export class FichajesController {
  constructor(private readonly fichajesService: FichajesService) {}

  @Public()
  @Post()
  async create(@Body() createFichajeDto: CreateFichajeDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.fichajesService.createFichaje(
      createFichajeDto.empleadoId,
      createFichajeDto.tipo,
      createFichajeDto.token,
      ipAddress,
      createFichajeDto.observaciones,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('empleadoId') empleadoId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.fichajesService.findAll(
      empleadoId,
      fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin ? new Date(fechaFin) : undefined,
    );
  }

  @Get('verify-integrity')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async verifyIntegrity() {
    const isValid = await this.fichajesService.verifyChainIntegrity();
    return {
      valid: isValid,
      message: isValid
        ? 'La cadena de fichajes es íntegra'
        : 'Se detectaron alteraciones en los fichajes',
    };
  }
}

