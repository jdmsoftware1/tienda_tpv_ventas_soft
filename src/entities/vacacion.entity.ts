import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { User } from './user.entity';

export enum EstadoVacacion {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
  CANCELADA = 'cancelada',
}

@Entity('vacaciones')
export class Vacacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'int' })
  dias_solicitados: number;

  @Column({
    type: 'enum',
    enum: EstadoVacacion,
    default: EstadoVacacion.PENDIENTE,
  })
  estado: EstadoVacacion;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones_admin: string | null;

  // Usuario que aprobó/rechazó
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'aprobado_por_id' })
  aprobado_por: User | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_aprobacion: Date | null;

  // Hash para inmutabilidad
  @Column({ type: 'varchar', length: 64 })
  hash: string;

  // Hash de la vacación anterior (encadenamiento)
  @Column({ type: 'varchar', length: 64, nullable: true })
  hash_anterior: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
