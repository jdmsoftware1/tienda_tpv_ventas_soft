import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('empleados')
@UseGuards(JwtAuthGuard)
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @Post()
  create(@Body() createEmpleadoDto: CreateEmpleadoDto) {
    return this.empleadosService.create(createEmpleadoDto);
  }

  @Get()
  findAll() {
    return this.empleadosService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.empleadosService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empleadosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmpleadoDto: UpdateEmpleadoDto) {
    return this.empleadosService.update(id, updateEmpleadoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empleadosService.remove(id);
  }

  // Endpoints TOTP (solo admin)
  @Post(':id/totp/generate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  generateTOTP(@Param('id') id: string) {
    return this.empleadosService.generateTOTP(id);
  }

  @Post(':id/totp/enable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  enableTOTP(@Param('id') id: string, @Body('token') token: string) {
    return this.empleadosService.enableTOTP(id, token);
  }

  @Post(':id/totp/disable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  disableTOTP(@Param('id') id: string) {
    return this.empleadosService.disableTOTP(id);
  }

  @Get(':id/totp/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getTOTPStatus(@Param('id') id: string) {
    return this.empleadosService.getTOTPStatus(id);
  }
}
