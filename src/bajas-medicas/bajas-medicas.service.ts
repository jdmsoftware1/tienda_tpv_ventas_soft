import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BajaMedica, TipoBajaMedica } from '../entities/baja-medica.entity';
import { Empleado } from '../entities/empleado.entity';

@Injectable()
export class BajasMedicasService {
  constructor(
    @InjectRepository(BajaMedica)
    private bajasRepository: Repository<BajaMedica>,
    @InjectRepository(Empleado)
    private empleadosRepository: Repository<Empleado>,
  ) {}

  async create(data: {
    empleadoId: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    tipo: TipoBajaMedica;
    diagnostico?: string;
    observaciones?: string;
    documento_justificativo?: string;
  }): Promise<BajaMedica> {
    const empleado = await this.empleadosRepository.findOne({
      where: { id: data.empleadoId },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    // Obtener el último hash para encadenamiento
    const bajas = await this.bajasRepository.find({
      where: { empleado: { id: data.empleadoId } },
      order: { created_at: 'DESC' },
      take: 1,
    });
    const ultimaBaja = bajas.length > 0 ? bajas[0] : null;

    const baja = this.bajasRepository.create({
      empleado,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      tipo: data.tipo,
      diagnostico: data.diagnostico,
      observaciones: data.observaciones,
      documento_justificativo: data.documento_justificativo,
      hash_anterior: ultimaBaja?.hash || null,
    });

    return await this.bajasRepository.save(baja);
  }

  async findAll(): Promise<BajaMedica[]> {
    return await this.bajasRepository.find({
      relations: ['empleado'],
      order: { created_at: 'DESC' },
    });
  }

  async findByEmpleado(empleadoId: string): Promise<BajaMedica[]> {
    return await this.bajasRepository.find({
      where: { empleado: { id: empleadoId } },
      order: { created_at: 'DESC' },
    });
  }

  async findActivas(): Promise<BajaMedica[]> {
    const hoy = new Date();
    return await this.bajasRepository
      .createQueryBuilder('baja')
      .where('baja.fecha_inicio <= :hoy', { hoy })
      .andWhere('baja.fecha_fin >= :hoy', { hoy })
      .leftJoinAndSelect('baja.empleado', 'empleado')
      .orderBy('baja.fecha_inicio', 'DESC')
      .getMany();
  }

  async verifyIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const bajas = await this.bajasRepository.find({
      order: { created_at: 'ASC' },
    });

    const errors: string[] = [];
    const hashMap = new Map<string, string | null>();

    for (const baja of bajas) {
      const empleadoId = baja.empleado.id;
      const expectedPrevHash = hashMap.get(empleadoId) || null;

      if (baja.hash_anterior !== expectedPrevHash) {
        errors.push(
          `Baja ${baja.id}: hash_anterior no coincide. Esperado: ${expectedPrevHash}, Actual: ${baja.hash_anterior}`,
        );
      }

      hashMap.set(empleadoId, baja.hash);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
