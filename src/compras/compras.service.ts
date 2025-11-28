import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Compra } from '../entities/compra.entity';
import { CompraArticulo } from '../entities/compra-articulo.entity';
import { CreateCompraDto } from './dto/create-compra.dto';
import { ArticulosService } from '../articulos/articulos.service';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @InjectRepository(CompraArticulo)
    private compraArticuloRepository: Repository<CompraArticulo>,
    private articulosService: ArticulosService,
    private dataSource: DataSource,
  ) {}

  async create(createCompraDto: CreateCompraDto): Promise<Compra> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compra = this.compraRepository.create({
        cliente_id: createCompraDto.cliente_id,
        total: createCompraDto.total,
        descripcion: createCompraDto.descripcion,
        es_varios: createCompraDto.es_varios || false,
      });

      const savedCompra = await queryRunner.manager.save(compra);

      if (createCompraDto.articulos && createCompraDto.articulos.length > 0) {
        for (const articuloDto of createCompraDto.articulos) {
          const compraArticulo = this.compraArticuloRepository.create({
            compra_id: savedCompra.id,
            articulo_id: articuloDto.articulo_id,
            cantidad: articuloDto.cantidad,
            precio_unitario: articuloDto.precio_unitario,
            subtotal: articuloDto.cantidad * articuloDto.precio_unitario,
          });

          await queryRunner.manager.save(compraArticulo);

          // Update stock
          await this.articulosService.updateStock(
            articuloDto.articulo_id,
            -articuloDto.cantidad,
          );
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedCompra.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Compra[]> {
    return this.compraRepository.find({
      relations: ['cliente', 'articulos', 'articulos.articulo'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Compra> {
    const compra = await this.compraRepository.findOne({
      where: { id },
      relations: ['cliente', 'articulos', 'articulos.articulo'],
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    return compra;
  }

  async findByCliente(clienteId: string): Promise<Compra[]> {
    return this.compraRepository.find({
      where: { cliente_id: clienteId },
      relations: ['articulos', 'articulos.articulo'],
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const compra = await this.findOne(id);
    await this.compraRepository.remove(compra);
  }
}
