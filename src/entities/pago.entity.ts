import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { CierreMes } from './cierre-mes.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.pagos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  cliente_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => CierreMes, (cierre) => cierre.pagos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cierre_mes_id' })
  cierre_mes: CierreMes;

  @Column({ nullable: true })
  cierre_mes_id: string;

  @CreateDateColumn()
  created_at: Date;
}
