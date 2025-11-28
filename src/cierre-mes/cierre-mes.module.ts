import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CierreMesService } from './cierre-mes.service';
import { CierreMesController } from './cierre-mes.controller';
import { CierreMes } from '../entities/cierre-mes.entity';
import { Compra } from '../entities/compra.entity';
import { Pago } from '../entities/pago.entity';
import { Devolucion } from '../entities/devolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CierreMes, Compra, Pago, Devolucion])],
  controllers: [CierreMesController],
  providers: [CierreMesService],
  exports: [CierreMesService],
})
export class CierreMesModule {}
