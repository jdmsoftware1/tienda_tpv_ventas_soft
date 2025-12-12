import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  id_empleado: string;

  @Column()
  nombre: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  totp_secret: string | null;

  @Column({ type: 'boolean', default: false })
  totp_enabled: boolean;

  // Días de vacaciones anuales (por defecto 22 días laborables en España)
  @Column({ type: 'int', default: 22 })
  dias_vacaciones_anuales: number;

  // Días de vacaciones disponibles este año
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 22 })
  dias_vacaciones_disponibles: number;

  @OneToMany(() => Cliente, (cliente) => cliente.empleado)
  clientes: Cliente[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
