import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';
import { Compra } from '../entities/compra.entity';
import { CompraArticulo } from '../entities/compra-articulo.entity';
import { ArticulosModule } from '../articulos/articulos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, CompraArticulo]),
    ArticulosModule,
  ],
  controllers: [ComprasController],
  providers: [ComprasService],
  exports: [ComprasService],
})
export class ComprasModule {}
