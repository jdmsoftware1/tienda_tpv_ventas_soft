import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { createHash } from 'crypto';

export enum TipoBajaMedica {
  ENFERMEDAD_COMUN = 'enfermedad_comun',
  ACCIDENTE_LABORAL = 'accidente_laboral',
  ACCIDENTE_NO_LABORAL = 'accidente_no_laboral',
  MATERNIDAD = 'maternidad',
  PATERNIDAD = 'paternidad',
  RIESGO_EMBARAZO = 'riesgo_embarazo',
  OTROS = 'otros',
}

@Entity('bajas_medicas')
export class BajaMedica {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empleado, { eager: true })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({
    type: 'enum',
    enum: TipoBajaMedica,
    default: TipoBajaMedica.ENFERMEDAD_COMUN,
  })
  tipo: TipoBajaMedica;

  @Column({ type: 'text', nullable: true })
  diagnostico: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  documento_justificativo: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  hash: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  hash_anterior: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateHash() {
    const data = JSON.stringify({
      empleado_id: this.empleado.id,
      fecha_inicio: this.fecha_inicio,
      fecha_fin: this.fecha_fin,
      tipo: this.tipo,
      diagnostico: this.diagnostico,
      hash_anterior: this.hash_anterior,
      timestamp: new Date().toISOString(),
    });
    this.hash = createHash('sha256').update(data).digest('hex');
  }
}
