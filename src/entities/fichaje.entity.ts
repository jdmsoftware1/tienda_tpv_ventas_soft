import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';

export enum TipoFichaje {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  INICIO_DESCANSO = 'inicio_descanso',
  FIN_DESCANSO = 'fin_descanso',
}

@Entity('fichajes')
export class Fichaje {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empleado, { eager: true })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @Column({
    type: 'enum',
    enum: TipoFichaje,
  })
  tipo: TipoFichaje;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_hora: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  // Hash para inmutabilidad (cumplimiento ley española)
  @Column({ type: 'varchar', length: 64, unique: true })
  hash: string;

  // Hash del fichaje anterior (blockchain-like)
  @Column({ type: 'varchar', length: 64, nullable: true })
  hash_anterior: string | null;
}
