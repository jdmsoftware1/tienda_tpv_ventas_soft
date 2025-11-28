import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from '../entities/empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
  ) {}

  async create(createEmpleadoDto: CreateEmpleadoDto): Promise<Empleado> {
    const exists = await this.empleadoRepository.findOne({
      where: { id_empleado: createEmpleadoDto.id_empleado },
    });

    if (exists) {
      throw new ConflictException('El ID de empleado ya existe');
    }

    const empleado = this.empleadoRepository.create(createEmpleadoDto);
    return this.empleadoRepository.save(empleado);
  }

  async findAll(): Promise<Empleado[]> {
    return this.empleadoRepository.find({
      relations: ['clientes'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id },
      relations: ['clientes'],
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return empleado;
  }

  async update(id: string, updateEmpleadoDto: UpdateEmpleadoDto): Promise<Empleado> {
    const empleado = await this.findOne(id);

    if (updateEmpleadoDto.id_empleado && updateEmpleadoDto.id_empleado !== empleado.id_empleado) {
      const exists = await this.empleadoRepository.findOne({
        where: { id_empleado: updateEmpleadoDto.id_empleado },
      });

      if (exists) {
        throw new ConflictException('El ID de empleado ya existe');
      }
    }

    Object.assign(empleado, updateEmpleadoDto);
    return this.empleadoRepository.save(empleado);
  }

  async remove(id: string): Promise<void> {
    const empleado = await this.findOne(id);
    await this.empleadoRepository.remove(empleado);
  }

  async search(query: string): Promise<Empleado[]> {
    return this.empleadoRepository
      .createQueryBuilder('empleado')
      .where('empleado.nombre ILIKE :query OR empleado.id_empleado ILIKE :query', {
        query: `%${query}%`,
      })
      .getMany();
  }
}
