import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { CompraArticulo } from './compra-articulo.entity';
import { CierreMes } from './cierre-mes.entity';

@Entity('compras')
export class Compra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.compras, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  cliente_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // Si es true, es una compra de "VARIOS" sin artículos específicos
  @Column({ default: false })
  es_varios: boolean;

  @OneToMany(() => CompraArticulo, (compraArticulo) => compraArticulo.compra, {
    cascade: true,
  })
  articulos: CompraArticulo[];

  @ManyToOne(() => CierreMes, (cierre) => cierre.compras, {
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
