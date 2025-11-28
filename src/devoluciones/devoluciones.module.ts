import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevolucionesService } from './devoluciones.service';
import { DevolucionesController } from './devoluciones.controller';
import { Devolucion } from '../entities/devolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Devolucion])],
  controllers: [DevolucionesController],
  providers: [DevolucionesService],
  exports: [DevolucionesService],
})
export class DevolucionesModule {}
