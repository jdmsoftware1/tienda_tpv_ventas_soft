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
import { ArticulosService } from './articulos.service';
import { CreateArticuloDto } from './dto/create-articulo.dto';
import { UpdateArticuloDto } from './dto/update-articulo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('articulos')
@UseGuards(JwtAuthGuard)
export class ArticulosController {
  constructor(private readonly articulosService: ArticulosService) {}

  @Post()
  create(@Body() createArticuloDto: CreateArticuloDto) {
    return this.articulosService.create(createArticuloDto);
  }

  @Get()
  findAll() {
    return this.articulosService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.articulosService.search(query);
  }

  @Get('barcode/:codigo')
  findByBarcode(@Param('codigo') codigo: string) {
    return this.articulosService.findByCodigoBarras(codigo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articulosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticuloDto: UpdateArticuloDto) {
    return this.articulosService.update(id, updateArticuloDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articulosService.remove(id);
  }
}
