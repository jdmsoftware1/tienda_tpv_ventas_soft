import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vacacion, EstadoVacacion } from '../entities/vacacion.entity';
import { Empleado } from '../entities/empleado.entity';
import { FestivosService } from '../festivos/festivos.service';
import * as crypto from 'crypto';

@Injectable()
export class VacacionesService {
  constructor(
    @InjectRepository(Vacacion)
    private vacacionRepository: Repository<Vacacion>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    private festivosService: FestivosService,
  ) {}

  private generateHash(vacacion: Partial<Vacacion>): string {
    const data = `${vacacion.empleado}${vacacion.fecha_inicio}${vacacion.fecha_fin}${vacacion.dias_solicitados}${vacacion.estado}${vacacion.hash_anterior || ''}${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async calcularDiasLaborables(
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<number> {
    let dias = 0;
    const current = new Date(fechaInicio);

    while (current <= fechaFin) {
      const diaSemana = current.getDay();
      
      // No contar sábados (6) ni domingos (0)
      if (diaSemana !== 0 && diaSemana !== 6) {
        // Verificar si es festivo
        const esFestivo = await this.festivosService.isFestivo(current);
        if (!esFestivo) {
          dias++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return dias;
  }

  async solicitar(
    empleadoId: string,
    fechaInicio: Date,
    fechaFin: Date,
    motivo?: string,
  ): Promise<Vacacion> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id: empleadoId },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    // Calcular días laborables
    const diasSolicitados = await this.calcularDiasLaborables(
      fechaInicio,
      fechaFin,
    );

    if (diasSolicitados === 0) {
      throw new BadRequestException('El período seleccionado no incluye días laborables');
    }

    // Verificar días disponibles
    if (diasSolicitados > empleado.dias_vacaciones_disponibles) {
      throw new BadRequestException(
        `No tienes suficientes días disponibles. Solicitados: ${diasSolicitados}, Disponibles: ${empleado.dias_vacaciones_disponibles}`,
      );
    }

    // Obtener último hash
    const vacaciones = await this.vacacionRepository.find({
      where: { empleado: { id: empleadoId } },
      order: { created_at: 'DESC' },
      take: 1,
    });
    const ultimaVacacion = vacaciones.length > 0 ? vacaciones[0] : null;

    const vacacion = this.vacacionRepository.create({
      empleado,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dias_solicitados: diasSolicitados,
      estado: EstadoVacacion.PENDIENTE,
      motivo: motivo || null,
      observaciones_admin: null,
      aprobado_por: null,
      fecha_aprobacion: null,
      hash_anterior: ultimaVacacion?.hash || null,
      hash: '',
    });

    vacacion.hash = this.generateHash(vacacion);

    return this.vacacionRepository.save(vacacion);
  }

  async aprobar(
    vacacionId: string,
    userId: string,
    observaciones?: string,
  ): Promise<Vacacion> {
    const vacacion = await this.vacacionRepository.findOne({
      where: { id: vacacionId },
      relations: ['empleado', 'aprobado_por'],
    });

    if (!vacacion) {
      throw new NotFoundException('Solicitud de vacaciones no encontrada');
    }

    if (vacacion.estado !== EstadoVacacion.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya ha sido procesada');
    }

    // Descontar días del empleado
    vacacion.empleado.dias_vacaciones_disponibles -= vacacion.dias_solicitados;
    await this.empleadoRepository.save(vacacion.empleado);

    vacacion.estado = EstadoVacacion.APROBADA;
    vacacion.observaciones_admin = observaciones || null;
    vacacion.aprobado_por = { id: userId } as any;
    vacacion.fecha_aprobacion = new Date();

    return this.vacacionRepository.save(vacacion);
  }

  async rechazar(
    vacacionId: string,
    userId: string,
    observaciones: string,
  ): Promise<Vacacion> {
    const vacacion = await this.vacacionRepository.findOne({
      where: { id: vacacionId },
      relations: ['empleado', 'aprobado_por'],
    });

    if (!vacacion) {
      throw new NotFoundException('Solicitud de vacaciones no encontrada');
    }

    if (vacacion.estado !== EstadoVacacion.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya ha sido procesada');
    }

    vacacion.estado = EstadoVacacion.RECHAZADA;
    vacacion.observaciones_admin = observaciones;
    vacacion.aprobado_por = { id: userId } as any;
    vacacion.fecha_aprobacion = new Date();

    return this.vacacionRepository.save(vacacion);
  }

  async findByEmpleado(empleadoId: string): Promise<Vacacion[]> {
    return this.vacacionRepository.find({
      where: { empleado: { id: empleadoId } },
      relations: ['empleado', 'aprobado_por'],
      order: { created_at: 'DESC' },
    });
  }

  async findPendientes(): Promise<Vacacion[]> {
    return this.vacacionRepository.find({
      where: { estado: EstadoVacacion.PENDIENTE },
      relations: ['empleado'],
      order: { created_at: 'ASC' },
    });
  }

  async findAll(): Promise<Vacacion[]> {
    return this.vacacionRepository.find({
      relations: ['empleado', 'aprobado_por'],
      order: { created_at: 'DESC' },
    });
  }

  async verifyChainIntegrity(): Promise<boolean> {
    const vacaciones = await this.vacacionRepository.find({
      order: { created_at: 'ASC' },
    });

    for (let i = 0; i < vacaciones.length; i++) {
      const vacacion = vacaciones[i];
      const expectedHash = this.generateHash(vacacion);

      if (vacacion.hash !== expectedHash) {
        return false;
      }

      if (i > 0 && vacacion.hash_anterior !== vacaciones[i - 1].hash) {
        return false;
      }
    }

    return true;
  }
}
