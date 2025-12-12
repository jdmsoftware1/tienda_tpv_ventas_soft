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

export enum DiaSemana {
  LUNES = 'lunes',
  MARTES = 'martes',
  MIERCOLES = 'miercoles',
  JUEVES = 'jueves',
  VIERNES = 'viernes',
  SABADO = 'sabado',
  DOMINGO = 'domingo',
}

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  // Año y número de semana (ISO 8601)
  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'int' })
  numero_semana: number;

  // Fecha de inicio y fin de la semana
  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  // Horarios de toda la semana en formato JSON
  @Column({ type: 'jsonb' })
  horarios_semana: {
    dia_semana: DiaSemana;
    hora_entrada_manana: string | null;
    hora_salida_manana: string | null;
    hora_entrada_tarde: string | null;
    hora_salida_tarde: string | null;
    es_dia_libre: boolean;
    horas_dia: number;
  }[];

  // Total de horas de la semana
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  horas_totales_semana: number;

  // ID de plantilla horaria aplicada (opcional)
  @Column({ type: 'uuid', nullable: true })
  plantilla_horaria_id: string | null;

  // Hash para inmutabilidad
  @Column({ type: 'varchar', length: 64 })
  hash: string;

  // Hash del horario anterior (encadenamiento)
  @Column({ type: 'varchar', length: 64, nullable: true })
  hash_anterior: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
