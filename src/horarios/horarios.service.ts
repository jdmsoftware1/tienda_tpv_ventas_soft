import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario, DiaSemana } from '../entities/horario.entity';
import { Empleado } from '../entities/empleado.entity';
import * as crypto from 'crypto';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private horarioRepository: Repository<Horario>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
  ) {}

  private generateHash(horario: Partial<Horario>): string {
    const data = JSON.stringify({
      empleado_id: horario.empleado,
      anio: horario.anio,
      numero_semana: horario.numero_semana,
      horarios_semana: horario.horarios_semana,
      hash_anterior: horario.hash_anterior,
      timestamp: Date.now(),
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private calcularHorasDia(
    entrada_manana: string | null,
    salida_manana: string | null,
    entrada_tarde: string | null,
    salida_tarde: string | null,
  ): number {
    let total = 0;

    if (entrada_manana && salida_manana) {
      const [h1, m1] = entrada_manana.split(':').map(Number);
      const [h2, m2] = salida_manana.split(':').map(Number);
      total += (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    }

    if (entrada_tarde && salida_tarde) {
      const [h1, m1] = entrada_tarde.split(':').map(Number);
      const [h2, m2] = salida_tarde.split(':').map(Number);
      total += (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    }

    return Math.round(total * 100) / 100;
  }

  private getWeekDates(year: number, week: number): { inicio: Date; fin: Date } {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const inicio = new Date(ISOweekStart);
    const fin = new Date(ISOweekStart);
    fin.setDate(fin.getDate() + 6);
    
    return { inicio, fin };
  }

  async setHorarioSemanal(
    empleadoId: string,
    anio: number,
    numeroSemana: number,
    horariosData: Array<{
      dia_semana: DiaSemana;
      hora_entrada_manana?: string;
      hora_salida_manana?: string;
      hora_entrada_tarde?: string;
      hora_salida_tarde?: string;
      es_dia_libre?: boolean;
    }>,
    plantillaHorariaId?: string,
  ): Promise<Horario> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id: empleadoId },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    // Obtener último hash para encadenamiento
    const horariosAnteriores = await this.horarioRepository.find({
      where: { empleado: { id: empleadoId } },
      order: { created_at: 'DESC' },
      take: 1,
    });
    const ultimoHorario = horariosAnteriores.length > 0 ? horariosAnteriores[0] : null;

    // Calcular horas de cada día y total de la semana
    const horariosSemana = horariosData.map(h => {
      const horasDia = h.es_dia_libre
        ? 0
        : this.calcularHorasDia(
            h.hora_entrada_manana || null,
            h.hora_salida_manana || null,
            h.hora_entrada_tarde || null,
            h.hora_salida_tarde || null,
          );

      return {
        dia_semana: h.dia_semana,
        hora_entrada_manana: h.hora_entrada_manana || null,
        hora_salida_manana: h.hora_salida_manana || null,
        hora_entrada_tarde: h.hora_entrada_tarde || null,
        hora_salida_tarde: h.hora_salida_tarde || null,
        es_dia_libre: h.es_dia_libre || false,
        horas_dia: horasDia,
      };
    });

    const horasTotalesSemana = horariosSemana.reduce(
      (sum, h) => sum + h.horas_dia,
      0,
    );

    const { inicio, fin } = this.getWeekDates(anio, numeroSemana);

    const nuevoHorario = this.horarioRepository.create({
      empleado,
      anio,
      numero_semana: numeroSemana,
      fecha_inicio: inicio,
      fecha_fin: fin,
      horarios_semana: horariosSemana,
      horas_totales_semana: horasTotalesSemana,
      plantilla_horaria_id: plantillaHorariaId || null,
      hash_anterior: ultimoHorario?.hash || null,
      hash: '',
    });

    nuevoHorario.hash = this.generateHash(nuevoHorario);

    return await this.horarioRepository.save(nuevoHorario);
  }

  async getHorarioEmpleado(empleadoId: string, anio?: number): Promise<Horario[]> {
    const where: any = { empleado: { id: empleadoId } };
    if (anio) {
      where.anio = anio;
    }

    return this.horarioRepository.find({
      where,
      order: { anio: 'DESC', numero_semana: 'DESC' },
      relations: ['empleado'],
    });
  }

  async getHorarioSemana(
    empleadoId: string,
    anio: number,
    numeroSemana: number,
  ): Promise<Horario | null> {
    return this.horarioRepository.findOne({
      where: {
        empleado: { id: empleadoId },
        anio,
        numero_semana: numeroSemana,
      },
      relations: ['empleado'],
    });
  }

  async copiarHorario(
    empleadoId: string,
    anioOrigen: number,
    semanaOrigen: number,
    anioDestino: number,
    semanaDestino: number,
  ): Promise<Horario> {
    const horarioOrigen = await this.getHorarioSemana(
      empleadoId,
      anioOrigen,
      semanaOrigen,
    );

    if (!horarioOrigen) {
      throw new NotFoundException('Horario origen no encontrado');
    }

    // Convertir horarios_semana al formato esperado
    const horariosParaCopiar = horarioOrigen.horarios_semana.map(h => ({
      dia_semana: h.dia_semana,
      hora_entrada_manana: h.hora_entrada_manana || undefined,
      hora_salida_manana: h.hora_salida_manana || undefined,
      hora_entrada_tarde: h.hora_entrada_tarde || undefined,
      hora_salida_tarde: h.hora_salida_tarde || undefined,
      es_dia_libre: h.es_dia_libre,
    }));

    return this.setHorarioSemanal(
      empleadoId,
      anioDestino,
      semanaDestino,
      horariosParaCopiar,
      horarioOrigen.plantilla_horaria_id || undefined,
    );
  }

  async getAllHorarios(): Promise<Horario[]> {
    return this.horarioRepository.find({
      relations: ['empleado'],
      order: { anio: 'DESC', numero_semana: 'DESC' },
    });
  }

  async verifyChainIntegrity(): Promise<boolean> {
    const horarios = await this.horarioRepository.find({
      order: { created_at: 'ASC' },
    });

    for (let i = 0; i < horarios.length; i++) {
      const horario = horarios[i];
      const expectedHash = this.generateHash(horario);

      if (horario.hash !== expectedHash) {
        return false;
      }

      if (i > 0 && horario.hash_anterior !== horarios[i - 1].hash) {
        return false;
      }
    }

    return true;
  }
}
