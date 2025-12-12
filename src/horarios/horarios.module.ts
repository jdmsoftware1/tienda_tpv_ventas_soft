import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorariosService } from './horarios.service';
import { HorariosController } from './horarios.controller';
import { Horario } from '../entities/horario.entity';
import { Empleado } from '../entities/empleado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Horario, Empleado])],
  providers: [HorariosService],
  controllers: [HorariosController],
  exports: [HorariosService],
})
export class HorariosModule {}
