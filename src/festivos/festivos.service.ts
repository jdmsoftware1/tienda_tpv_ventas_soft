import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Festivo, TipoFestivo } from '../entities/festivo.entity';
import * as crypto from 'crypto';

@Injectable()
export class FestivosService {
  constructor(
    @InjectRepository(Festivo)
    private festivoRepository: Repository<Festivo>,
  ) {}

  private generateHash(festivo: Partial<Festivo>): string {
    const data = `${festivo.fecha}${festivo.nombre}${festivo.tipo}${festivo.hash_anterior || ''}${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async create(
    fecha: Date,
    nombre: string,
    tipo: TipoFestivo,
    descripcion?: string,
  ): Promise<Festivo> {
    // Verificar que no exista ya un festivo en esa fecha
    const existente = await this.festivoRepository.findOne({
      where: { fecha },
    });

    if (existente) {
      throw new ConflictException('Ya existe un festivo en esa fecha');
    }

    // Obtener último hash
    const festivos = await this.festivoRepository.find({
      order: { created_at: 'DESC' },
      take: 1,
    });
    const ultimoFestivo = festivos.length > 0 ? festivos[0] : null;

    const festivo = this.festivoRepository.create({
      fecha,
      nombre,
      tipo,
      descripcion: descripcion || null,
      hash_anterior: ultimoFestivo?.hash || null,
      hash: '',
    });

    festivo.hash = this.generateHash(festivo);

    return this.festivoRepository.save(festivo);
  }

  async findAll(): Promise<Festivo[]> {
    return this.festivoRepository.find({
      order: { fecha: 'ASC' },
    });
  }

  async findByYear(year: number): Promise<Festivo[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.festivoRepository.find({
      where: {
        fecha: Between(startDate, endDate),
      },
      order: { fecha: 'ASC' },
    });
  }

  async isFestivo(fecha: Date): Promise<boolean> {
    const festivo = await this.festivoRepository.findOne({
      where: { fecha },
    });

    return !!festivo;
  }

  async verifyChainIntegrity(): Promise<boolean> {
    const festivos = await this.festivoRepository.find({
      order: { created_at: 'ASC' },
    });

    for (let i = 0; i < festivos.length; i++) {
      const festivo = festivos[i];
      const expectedHash = this.generateHash(festivo);

      if (festivo.hash !== expectedHash) {
        return false;
      }

      if (i > 0 && festivo.hash_anterior !== festivos[i - 1].hash) {
        return false;
      }
    }

    return true;
  }
}
