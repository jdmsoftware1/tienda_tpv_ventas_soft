import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Compra } from './compra.entity';
import { Articulo } from './articulo.entity';

@Entity('compra_articulos')
export class CompraArticulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Compra, (compra) => compra.articulos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'compra_id' })
  compra: Compra;

  @Column()
  compra_id: string;

  @ManyToOne(() => Articulo, (articulo) => articulo.compraArticulos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column()
  articulo_id: string;

  @Column('int')
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_unitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;
}
