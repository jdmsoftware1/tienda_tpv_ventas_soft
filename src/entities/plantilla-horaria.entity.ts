import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { createHash } from 'crypto';

@Entity('plantillas_horarias')
export class PlantillaHoraria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'jsonb' })
  horarios: {
    dia_semana: string;
    hora_entrada_manana: string;
    hora_salida_manana: string;
    hora_entrada_tarde: string;
    hora_salida_tarde: string;
    es_dia_libre: boolean;
  }[];

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
      nombre: this.nombre,
      descripcion: this.descripcion,
      horarios: this.horarios,
      hash_anterior: this.hash_anterior,
      timestamp: new Date().toISOString(),
    });
    this.hash = createHash('sha256').update(data).digest('hex');
  }
}
