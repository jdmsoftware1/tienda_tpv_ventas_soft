import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from '../entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
  ) {}

  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const pago = this.pagoRepository.create(createPagoDto);
    return this.pagoRepository.save(pago);
  }

  async findAll(): Promise<Pago[]> {
    return this.pagoRepository.find({
      relations: ['cliente'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }

  async findByCliente(clienteId: string): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { cliente_id: clienteId },
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const pago = await this.findOne(id);
    await this.pagoRepository.remove(pago);
  }
}
