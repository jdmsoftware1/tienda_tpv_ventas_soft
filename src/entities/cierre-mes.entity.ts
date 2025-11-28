import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Compra } from './compra.entity';
import { Pago } from './pago.entity';
import { Devolucion } from './devolucion.entity';

@Entity('cierre_mes')
export class CierreMes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fecha_inicio: Date;

  @Column()
  fecha_fin: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  total_ventas: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_pagos: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_devoluciones: number;

  @Column({ default: false })
  cerrado: boolean;

  @OneToMany(() => Compra, (compra) => compra.cierre_mes)
  compras: Compra[];

  @OneToMany(() => Pago, (pago) => pago.cierre_mes)
  pagos: Pago[];

  @OneToMany(() => Devolucion, (devolucion) => devolucion.cierre_mes)
  devoluciones: Devolucion[];

  @CreateDateColumn()
  created_at: Date;
}
