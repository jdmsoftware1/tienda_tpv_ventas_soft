import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticulosService } from './articulos.service';
import { ArticulosController } from './articulos.controller';
import { Articulo } from '../entities/articulo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Articulo])],
  controllers: [ArticulosController],
  providers: [ArticulosService],
  exports: [ArticulosService],
})
export class ArticulosModule {}
