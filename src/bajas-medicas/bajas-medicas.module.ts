import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BajaMedica } from '../entities/baja-medica.entity';
import { Empleado } from '../entities/empleado.entity';
import { BajasMedicasController } from './bajas-medicas.controller';
import { BajasMedicasService } from './bajas-medicas.service';

@Module({
  imports: [TypeOrmModule.forFeature([BajaMedica, Empleado])],
  controllers: [BajasMedicasController],
  providers: [BajasMedicasService],
  exports: [BajasMedicasService],
})
export class BajasMedicasModule {}
