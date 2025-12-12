import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum TipoFestivo {
  NACIONAL = 'nacional',
  AUTONOMICO = 'autonomico',
  LOCAL = 'local',
}

@Entity('festivos')
export class Festivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({
    type: 'enum',
    enum: TipoFestivo,
    default: TipoFestivo.NACIONAL,
  })
  tipo: TipoFestivo;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  // Hash para inmutabilidad
  @Column({ type: 'varchar', length: 64 })
  hash: string;

  // Hash del festivo anterior (encadenamiento)
  @Column({ type: 'varchar', length: 64, nullable: true })
  hash_anterior: string | null;

  @CreateDateColumn()
  created_at: Date;
}
