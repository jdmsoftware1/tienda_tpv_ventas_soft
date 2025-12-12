import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacacionesService } from './vacaciones.service';
import { VacacionesController } from './vacaciones.controller';
import { Vacacion } from '../entities/vacacion.entity';
import { Empleado } from '../entities/empleado.entity';
import { FestivosModule } from '../festivos/festivos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vacacion, Empleado]),
    FestivosModule,
  ],
  providers: [VacacionesService],
  controllers: [VacacionesController],
  exports: [VacacionesService],
})
export class VacacionesModule {}
