import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pagos')
@UseGuards(JwtAuthGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  create(@Body() createPagoDto: CreatePagoDto) {
    return this.pagosService.create(createPagoDto);
  }

  @Get()
  findAll() {
    return this.pagosService.findAll();
  }

  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.pagosService.findByCliente(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagosService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagosService.remove(id);
  }
}
