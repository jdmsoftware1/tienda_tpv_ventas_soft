import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Devolucion } from '../entities/devolucion.entity';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';

@Injectable()
export class DevolucionesService {
  constructor(
    @InjectRepository(Devolucion)
    private devolucionRepository: Repository<Devolucion>,
  ) {}

  async create(createDevolucionDto: CreateDevolucionDto): Promise<Devolucion> {
    const devolucion = this.devolucionRepository.create(createDevolucionDto);
    return this.devolucionRepository.save(devolucion);
  }

  async findAll(): Promise<Devolucion[]> {
    return this.devolucionRepository.find({
      relations: ['cliente'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Devolucion> {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });

    if (!devolucion) {
      throw new NotFoundException('Devolución no encontrada');
    }

    return devolucion;
  }

  async findByCliente(clienteId: string): Promise<Devolucion[]> {
    return this.devolucionRepository.find({
      where: { cliente_id: clienteId },
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const devolucion = await this.findOne(id);
    await this.devolucionRepository.remove(devolucion);
  }
}
