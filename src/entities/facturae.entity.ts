import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Compra } from './compra.entity';

export enum TipoFacturae {
  FC = 'FC', // Factura Completa
  FA = 'FA', // Factura Abreviada
  AF = 'AF', // Autofactura
}

export enum EstadoFacturae {
  BORRADOR = 'borrador',
  GENERADA = 'generada',
  ENVIADA = 'enviada',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
}

@Entity('facturae')
export class Facturae {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Compra, { nullable: true })
  @JoinColumn({ name: 'compra_id' })
  compra: Compra | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  numero_factura: string;

  @Column({ type: 'varchar', length: 20 })
  serie: string;

  @Column({
    type: 'enum',
    enum: TipoFacturae,
    default: TipoFacturae.FC,
  })
  tipo: TipoFacturae;

  @Column({ type: 'date' })
  fecha_expedicion: Date;

  @Column({ type: 'date', nullable: true })
  fecha_operacion: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_imponible: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tipo_iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cuota_iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_factura: number;

  // XML Facturae generado
  @Column({ type: 'text', nullable: true })
  xml_content: string | null;

  // Hash del XML para verificación
  @Column({ type: 'varchar', length: 64, nullable: true })
  xml_hash: string | null;

  @Column({
    type: 'enum',
    enum: EstadoFacturae,
    default: EstadoFacturae.BORRADOR,
  })
  estado: EstadoFacturae;

  // Observaciones
  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
