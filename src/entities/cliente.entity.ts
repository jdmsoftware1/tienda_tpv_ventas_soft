import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { Compra } from './compra.entity';
import { Pago } from './pago.entity';
import { Devolucion } from './devolucion.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  num_cliente: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  direccion: string;

  @ManyToOne(() => Empleado, (empleado) => empleado.clientes, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @Column({ nullable: true })
  empleado_id: string;

  @OneToMany(() => Compra, (compra) => compra.cliente)
  compras: Compra[];

  @OneToMany(() => Pago, (pago) => pago.cliente)
  pagos: Pago[];

  @OneToMany(() => Devolucion, (devolucion) => devolucion.cliente)
  devoluciones: Devolucion[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual field - calculated from compras, pagos and devoluciones
  balance?: number;
}
