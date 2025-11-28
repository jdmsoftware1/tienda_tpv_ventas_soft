import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { CierreMes } from '../entities/cierre-mes.entity';
import { Compra } from '../entities/compra.entity';
import { Pago } from '../entities/pago.entity';
import { Devolucion } from '../entities/devolucion.entity';
import { CreateCierreMesDto } from './dto/create-cierre-mes.dto';

@Injectable()
export class CierreMesService {
  constructor(
    @InjectRepository(CierreMes)
    private cierreMesRepository: Repository<CierreMes>,
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Devolucion)
    private devolucionRepository: Repository<Devolucion>,
  ) {}

  async create(createCierreMesDto: CreateCierreMesDto): Promise<CierreMes> {
    const { fecha_inicio, fecha_fin } = createCierreMesDto;

    // Verificar que no haya un cierre existente que se solape
    const existingCierre = await this.cierreMesRepository
      .createQueryBuilder('cierre')
      .where(
        '(cierre.fecha_inicio <= :fecha_fin AND cierre.fecha_fin >= :fecha_inicio)',
        { fecha_inicio, fecha_fin },
      )
      .getOne();

    if (existingCierre) {
      throw new BadRequestException('Ya existe un cierre de mes en este rango de fechas');
    }

    // Obtener todas las transacciones en el rango
    const compras = await this.compraRepository.find({
      where: {
        created_at: Between(fecha_inicio, fecha_fin),
        cierre_mes_id: IsNull(),
      },
    });

    const pagos = await this.pagoRepository.find({
      where: {
        created_at: Between(fecha_inicio, fecha_fin),
        cierre_mes_id: IsNull(),
      },
    });

    const devoluciones = await this.devolucionRepository.find({
      where: {
        created_at: Between(fecha_inicio, fecha_fin),
        cierre_mes_id: IsNull(),
      },
    });

    // Calcular totales
    const total_ventas = compras.reduce((sum, compra) => sum + Number(compra.total), 0);
    const total_pagos = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
    const total_devoluciones = devoluciones.reduce((sum, dev) => sum + Number(dev.monto), 0);

    // Crear cierre
    const cierre = this.cierreMesRepository.create({
      fecha_inicio,
      fecha_fin,
      total_ventas,
      total_pagos,
      total_devoluciones,
      cerrado: true,
    });

    const savedCierre = await this.cierreMesRepository.save(cierre);

    // Asociar transacciones al cierre
    await this.compraRepository.update(
      compras.map(c => c.id),
      { cierre_mes_id: savedCierre.id },
    );

    await this.pagoRepository.update(
      pagos.map(p => p.id),
      { cierre_mes_id: savedCierre.id },
    );

    await this.devolucionRepository.update(
      devoluciones.map(d => d.id),
      { cierre_mes_id: savedCierre.id },
    );

    return this.findOne(savedCierre.id);
  }

  async findAll(): Promise<CierreMes[]> {
    return this.cierreMesRepository.find({
      order: { fecha_fin: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CierreMes> {
    const cierre = await this.cierreMesRepository.findOne({
      where: { id },
      relations: ['compras', 'pagos', 'devoluciones'],
    });

    if (!cierre) {
      throw new NotFoundException('Cierre de mes no encontrado');
    }

    return cierre;
  }

  async getAnalytics(fechaInicio?: Date, fechaFin?: Date) {
    let query = this.cierreMesRepository.createQueryBuilder('cierre');

    if (fechaInicio && fechaFin) {
      query = query.where('cierre.fecha_inicio >= :fechaInicio AND cierre.fecha_fin <= :fechaFin', {
        fechaInicio,
        fechaFin,
      });
    }

    const cierres = await query.orderBy('cierre.fecha_fin', 'DESC').getMany();

    return {
      cierres,
      totales: {
        ventas: cierres.reduce((sum, c) => sum + Number(c.total_ventas), 0),
        pagos: cierres.reduce((sum, c) => sum + Number(c.total_pagos), 0),
        devoluciones: cierres.reduce((sum, c) => sum + Number(c.total_devoluciones), 0),
      },
    };
  }

  async getCurrentMonthStats() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const compras = await this.compraRepository.find({
      where: {
        created_at: Between(firstDay, lastDay),
      },
    });

    const pagos = await this.pagoRepository.find({
      where: {
        created_at: Between(firstDay, lastDay),
      },
    });

    const devoluciones = await this.devolucionRepository.find({
      where: {
        created_at: Between(firstDay, lastDay),
      },
    });

    return {
      periodo: {
        inicio: firstDay,
        fin: lastDay,
      },
      total_ventas: compras.reduce((sum, c) => sum + Number(c.total), 0),
      total_pagos: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
      total_devoluciones: devoluciones.reduce((sum, d) => sum + Number(d.monto), 0),
      cantidad_ventas: compras.length,
      cantidad_pagos: pagos.length,
      cantidad_devoluciones: devoluciones.length,
    };
  }
}
