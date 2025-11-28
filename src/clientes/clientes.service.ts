import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const exists = await this.clienteRepository.findOne({
      where: { num_cliente: createClienteDto.num_cliente },
    });

    if (exists) {
      throw new ConflictException('El número de cliente ya existe');
    }

    const cliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async findAll(): Promise<Cliente[]> {
    const clientes = await this.clienteRepository.find({
      relations: ['empleado', 'compras', 'pagos', 'devoluciones'],
      order: { nombre: 'ASC' },
    });

    return clientes.map((cliente) => this.calculateBalance(cliente));
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
      relations: ['empleado', 'compras', 'pagos', 'devoluciones'],
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return this.calculateBalance(cliente);
  }

  async update(id: string, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);

    if (updateClienteDto.num_cliente && updateClienteDto.num_cliente !== cliente.num_cliente) {
      const exists = await this.clienteRepository.findOne({
        where: { num_cliente: updateClienteDto.num_cliente },
      });

      if (exists) {
        throw new ConflictException('El número de cliente ya existe');
      }
    }

    Object.assign(cliente, updateClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async remove(id: string): Promise<void> {
    const cliente = await this.findOne(id);
    await this.clienteRepository.remove(cliente);
  }

  async search(query: string): Promise<Cliente[]> {
    const clientes = await this.clienteRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.empleado', 'empleado')
      .leftJoinAndSelect('cliente.compras', 'compras')
      .leftJoinAndSelect('cliente.pagos', 'pagos')
      .leftJoinAndSelect('cliente.devoluciones', 'devoluciones')
      .where('cliente.nombre ILIKE :query OR cliente.num_cliente ILIKE :query OR cliente.telefono ILIKE :query', {
        query: `%${query}%`,
      })
      .getMany();

    return clientes.map((cliente) => this.calculateBalance(cliente));
  }

  private calculateBalance(cliente: Cliente): Cliente {
    const totalCompras = cliente.compras?.reduce((sum, compra) => sum + Number(compra.total), 0) || 0;
    const totalPagos = cliente.pagos?.reduce((sum, pago) => sum + Number(pago.monto), 0) || 0;
    const totalDevoluciones = cliente.devoluciones?.reduce((sum, dev) => sum + Number(dev.monto), 0) || 0;

    cliente.balance = totalCompras - totalPagos - totalDevoluciones;
    return cliente;
  }
}
