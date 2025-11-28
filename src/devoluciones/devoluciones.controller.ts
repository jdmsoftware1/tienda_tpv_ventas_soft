import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DevolucionesService } from './devoluciones.service';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('devoluciones')
@UseGuards(JwtAuthGuard)
export class DevolucionesController {
  constructor(private readonly devolucionesService: DevolucionesService) {}

  @Post()
  create(@Body() createDevolucionDto: CreateDevolucionDto) {
    return this.devolucionesService.create(createDevolucionDto);
  }

  @Get()
  findAll() {
    return this.devolucionesService.findAll();
  }

  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.devolucionesService.findByCliente(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devolucionesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devolucionesService.remove(id);
  }
}
