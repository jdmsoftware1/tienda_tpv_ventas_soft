import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillaHoraria } from '../entities/plantilla-horaria.entity';
import { PlantillasHorariasController } from './plantillas-horarias.controller';
import { PlantillasHorariasService } from './plantillas-horarias.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlantillaHoraria])],
  controllers: [PlantillasHorariasController],
  providers: [PlantillasHorariasService],
  exports: [PlantillasHorariasService],
})
export class PlantillasHorariasModule {}
