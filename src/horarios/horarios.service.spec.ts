import { Test, TestingModule } from '@nestjs/testing';
import { HorariosService } from './horarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Horario } from '../entities/horario.entity';
import { Empleado } from '../entities/empleado.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('HorariosService', () => {
  let service: HorariosService;
  let horarioRepository: Repository<Horario>;
  let empleadoRepository: Repository<Empleado>;

  const mockEmpleado = {
    id: '1',
    nombre: 'Juan',
    apellidos: 'Pérez',
    id_empleado: 'EMP001',
  };

  const mockHorario = {
    id: '1',
    empleado: mockEmpleado,
    anio: 2025,
    numero_semana: 50,
    fecha_inicio: new Date('2025-12-08'),
    fecha_fin: new Date('2025-12-14'),
    horarios_semana: [
      {
        dia_semana: 'lunes',
        hora_entrada_manana: '09:00',
        hora_salida_manana: '14:00',
        hora_entrada_tarde: '16:00',
        hora_salida_tarde: '20:00',
        es_dia_libre: false,
        horas_dia: 9,
      },
    ],
    horas_totales_semana: 40,
    plantilla_horaria_id: null,
    hash: 'test-hash',
    hash_anterior: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HorariosService,
        {
          provide: getRepositoryToken(Horario),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Empleado),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HorariosService>(HorariosService);
    horarioRepository = module.get<Repository<Horario>>(
      getRepositoryToken(Horario),
    );
    empleadoRepository = module.get<Repository<Empleado>>(
      getRepositoryToken(Empleado),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setHorarioSemanal', () => {
    it('should create a weekly schedule', async () => {
      jest.spyOn(empleadoRepository, 'findOne').mockResolvedValue(mockEmpleado as any);
      jest.spyOn(horarioRepository, 'find').mockResolvedValue([]);
      jest.spyOn(horarioRepository, 'create').mockReturnValue(mockHorario as any);
      jest.spyOn(horarioRepository, 'save').mockResolvedValue(mockHorario as any);

      const result = await service.setHorarioSemanal(
        '1',
        2025,
        50,
        [
          {
            dia_semana: 'lunes' as any,
            hora_entrada_manana: '09:00',
            hora_salida_manana: '14:00',
            hora_entrada_tarde: '16:00',
            hora_salida_tarde: '20:00',
            es_dia_libre: false,
          },
        ],
      );

      expect(result).toBeDefined();
      expect(empleadoRepository.findOne).toHaveBeenCalled();
      expect(horarioRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      jest.spyOn(empleadoRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.setHorarioSemanal('999', 2025, 50, []),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHorarioSemana', () => {
    it('should get schedule for a specific week', async () => {
      jest.spyOn(horarioRepository, 'findOne').mockResolvedValue(mockHorario as any);

      const result = await service.getHorarioSemana('1', 2025, 50);

      expect(result).toBeDefined();
      expect(result?.numero_semana).toBe(50);
    });

    it('should return null if schedule not found', async () => {
      jest.spyOn(horarioRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getHorarioSemana('1', 2025, 1);

      expect(result).toBeNull();
    });
  });

  describe('copiarHorario', () => {
    it('should copy schedule from one week to another', async () => {
      jest.spyOn(horarioRepository, 'findOne').mockResolvedValue(mockHorario as any);
      jest.spyOn(empleadoRepository, 'findOne').mockResolvedValue(mockEmpleado as any);
      jest.spyOn(horarioRepository, 'find').mockResolvedValue([]);
      jest.spyOn(horarioRepository, 'create').mockReturnValue(mockHorario as any);
      jest.spyOn(horarioRepository, 'save').mockResolvedValue(mockHorario as any);

      const result = await service.copiarHorario('1', 2025, 50, 2025, 51);

      expect(result).toBeDefined();
      expect(horarioRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if source schedule not found', async () => {
      jest.spyOn(horarioRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.copiarHorario('1', 2025, 50, 2025, 51),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllHorarios', () => {
    it('should return all schedules', async () => {
      jest.spyOn(horarioRepository, 'find').mockResolvedValue([mockHorario] as any);

      const result = await service.getAllHorarios();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
