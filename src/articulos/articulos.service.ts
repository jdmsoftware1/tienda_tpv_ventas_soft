import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Articulo } from '../entities/articulo.entity';
import { CreateArticuloDto } from './dto/create-articulo.dto';
import { UpdateArticuloDto } from './dto/update-articulo.dto';

@Injectable()
export class ArticulosService {
  constructor(
    @InjectRepository(Articulo)
    private articuloRepository: Repository<Articulo>,
  ) {}

  async create(createArticuloDto: CreateArticuloDto): Promise<Articulo> {
    const exists = await this.articuloRepository.findOne({
      where: { codigo_barras: createArticuloDto.codigo_barras },
    });

    if (exists) {
      throw new ConflictException('El código de barras ya existe');
    }

    const articulo = this.articuloRepository.create(createArticuloDto);
    return this.articuloRepository.save(articulo);
  }

  async findAll(): Promise<Articulo[]> {
    return this.articuloRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Articulo> {
    const articulo = await this.articuloRepository.findOne({
      where: { id },
    });

    if (!articulo) {
      throw new NotFoundException('Artículo no encontrado');
    }

    return articulo;
  }

  async findByCodigoBarras(codigo_barras: string): Promise<Articulo> {
    const articulo = await this.articuloRepository.findOne({
      where: { codigo_barras },
    });

    if (!articulo) {
      throw new NotFoundException('Artículo no encontrado');
    }

    return articulo;
  }

  async update(id: string, updateArticuloDto: UpdateArticuloDto): Promise<Articulo> {
    const articulo = await this.findOne(id);

    if (updateArticuloDto.codigo_barras && updateArticuloDto.codigo_barras !== articulo.codigo_barras) {
      const exists = await this.articuloRepository.findOne({
        where: { codigo_barras: updateArticuloDto.codigo_barras },
      });

      if (exists) {
        throw new ConflictException('El código de barras ya existe');
      }
    }

    Object.assign(articulo, updateArticuloDto);
    return this.articuloRepository.save(articulo);
  }

  async remove(id: string): Promise<void> {
    const articulo = await this.findOne(id);
    await this.articuloRepository.remove(articulo);
  }

  async search(query: string): Promise<Articulo[]> {
    return this.articuloRepository
      .createQueryBuilder('articulo')
      .where('articulo.nombre ILIKE :query OR articulo.codigo_barras ILIKE :query', {
        query: `%${query}%`,
      })
      .getMany();
  }

  async updateStock(id: string, cantidad: number): Promise<Articulo> {
    const articulo = await this.findOne(id);
    articulo.cantidad += cantidad;
    return this.articuloRepository.save(articulo);
  }
}
