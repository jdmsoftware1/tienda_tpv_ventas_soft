import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Compra } from './compra.entity';

export enum TipoDocumento {
  TICKET = 'ticket',
  FACTURA = 'factura',
  FACTURA_SIMPLIFICADA = 'factura_simplificada',
}

export enum EstadoVerifactu {
  PENDIENTE = 'pendiente',
  FIRMADO = 'firmado',
  ENVIADO = 'enviado',
  ERROR = 'error',
}

@Entity('verifactu_documents')
export class VerifactuDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Compra, { nullable: true })
  @JoinColumn({ name: 'compra_id' })
  compra: Compra | null;

  @Column({
    type: 'enum',
    enum: TipoDocumento,
  })
  tipo_documento: TipoDocumento;

  @Column({ type: 'varchar', length: 50, unique: true })
  numero_documento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  importe_total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  base_imponible: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tipo_iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cuota_iva: number;

  // Firma electrónica (hash SHA-256)
  @Column({ type: 'varchar', length: 64 })
  firma_electronica: string;

  // Hash del documento anterior (encadenamiento)
  @Column({ type: 'varchar', length: 64, nullable: true })
  hash_anterior: string | null;

  // Código QR TBAI (formato base64)
  @Column({ type: 'text', nullable: true })
  qr_code: string | null;

  // Estado del documento
  @Column({
    type: 'enum',
    enum: EstadoVerifactu,
    default: EstadoVerifactu.PENDIENTE,
  })
  estado: EstadoVerifactu;

  // Fecha de envío a AEAT
  @Column({ type: 'timestamp', nullable: true })
  fecha_envio: Date | null;

  // Respuesta de AEAT
  @Column({ type: 'text', nullable: true })
  respuesta_aeat: string | null;

  @CreateDateColumn()
  created_at: Date;
}
