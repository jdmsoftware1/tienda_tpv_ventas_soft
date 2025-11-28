import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompraArticulo } from './compra-articulo.entity';

@Entity('articulos')
export class Articulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo_barras: string;

  @Column()
  nombre: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_compra: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_venta: number;

  @Column('int', { default: 0 })
  cantidad: number;

  @OneToMany(() => CompraArticulo, (compraArticulo) => compraArticulo.articulo)
  compraArticulos: CompraArticulo[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
