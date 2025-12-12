import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichajesService } from './fichajes.service';
import { FichajesController } from './fichajes.controller';
import { Fichaje } from '../entities/fichaje.entity';
import { Empleado } from '../entities/empleado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fichaje, Empleado])],
  providers: [FichajesService],
  controllers: [FichajesController],
  exports: [FichajesService],
})
export class FichajesModule {}
