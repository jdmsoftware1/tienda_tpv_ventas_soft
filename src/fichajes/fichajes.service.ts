import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fichaje, TipoFichaje } from '../entities/fichaje.entity';
import { Empleado } from '../entities/empleado.entity';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';

@Injectable()
export class FichajesService {
  constructor(
    @InjectRepository(Fichaje)
    private fichajesRepository: Repository<Fichaje>,
    @InjectRepository(Empleado)
    private empleadosRepository: Repository<Empleado>,
  ) {}

  // Generar hash para inmutabilidad
  private generateHash(fichaje: Fichaje): string {
    const data = `${fichaje.empleado.id}|${fichaje.tipo}|${fichaje.fecha_hora}|${fichaje.hash_anterior || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Obtener el último fichaje para encadenar hashes
  async getLastFichaje(): Promise<Fichaje | null> {
    return this.fichajesRepository.findOne({
      order: { fecha_hora: 'DESC' },
    });
  }

  // Verificar código TOTP
  async verifyTOTP(empleadoId: string, token: string): Promise<boolean> {
    const empleado = await this.empleadosRepository.findOne({
      where: { id: empleadoId },
    });

    if (!empleado || !empleado.totp_enabled || !empleado.totp_secret) {
      throw new BadRequestException('Empleado no tiene TOTP configurado');
    }

    return authenticator.verify({
      token,
      secret: empleado.totp_secret,
    });
  }

  // Crear fichaje
  async createFichaje(
    empleadoId: string,
    tipo: TipoFichaje,
    token: string,
    ipAddress?: string,
    observaciones?: string,
  ): Promise<Fichaje> {
    // Verificar TOTP
    const isValid = await this.verifyTOTP(empleadoId, token);
    if (!isValid) {
      throw new BadRequestException('Código de autenticación inválido');
    }

    const empleado = await this.empleadosRepository.findOne({
      where: { id: empleadoId },
    });

    if (!empleado) {
      throw new BadRequestException('Empleado no encontrado');
    }

    // Obtener último fichaje para encadenar
    const lastFichaje = await this.getLastFichaje();

    const fichaje = new Fichaje();
    fichaje.empleado = empleado;
    fichaje.tipo = tipo;
    fichaje.ip_address = ipAddress || null;
    fichaje.observaciones = observaciones || null;
    fichaje.hash_anterior = lastFichaje?.hash || null;
    fichaje.fecha_hora = new Date();

    // Generar hash
    fichaje.hash = this.generateHash(fichaje);

    return await this.fichajesRepository.save(fichaje);
  }

  // Listar fichajes
  async findAll(
    empleadoId?: string,
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<Fichaje[]> {
    const query = this.fichajesRepository.createQueryBuilder('fichaje')
      .leftJoinAndSelect('fichaje.empleado', 'empleado')
      .orderBy('fichaje.fecha_hora', 'DESC');

    if (empleadoId) {
      query.andWhere('fichaje.empleado_id = :empleadoId', { empleadoId });
    }

    if (fechaInicio) {
      query.andWhere('fichaje.fecha_hora >= :fechaInicio', { fechaInicio });
    }

    if (fechaFin) {
      query.andWhere('fichaje.fecha_hora <= :fechaFin', { fechaFin });
    }

    return query.getMany();
  }

  // Verificar integridad de la cadena de hashes
  async verifyChainIntegrity(): Promise<boolean> {
    const fichajes = await this.fichajesRepository.find({
      order: { fecha_hora: 'ASC' },
    });

    for (let i = 0; i < fichajes.length; i++) {
      const fichaje = fichajes[i];
      const expectedHash = this.generateHash(fichaje);

      if (fichaje.hash !== expectedHash) {
        return false;
      }

      if (i > 0 && fichaje.hash_anterior !== fichajes[i - 1].hash) {
        return false;
      }
    }

    return true;
  }
}
