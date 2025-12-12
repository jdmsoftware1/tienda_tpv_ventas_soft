import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FestivosService } from './festivos.service';
import { FestivosController } from './festivos.controller';
import { Festivo } from '../entities/festivo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Festivo])],
  providers: [FestivosService],
  controllers: [FestivosController],
  exports: [FestivosService],
})
export class FestivosModule {}
