import { Test, TestingModule } from '@nestjs/testing';
import { BajasMedicasService } from './bajas-medicas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BajaMedica, TipoBajaMedica } from '../entities/baja-medica.entity';
import { Empleado } from '../entities/empleado.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('BajasMedicasService', () => {
  let service: BajasMedicasService;
  let bajasRepository: Repository<BajaMedica>;
  let empleadosRepository: Repository<Empleado>;

  const mockEmpleado = {
    id: '1',
    nombre: 'Juan',
    apellidos: 'Pérez',
  };

  const mockBaja = {
    id: '1',
    empleado: mockEmpleado,
    fecha_inicio: new Date('2025-12-01'),
    fecha_fin: new Date('2025-12-10'),
    tipo: TipoBajaMedica.ENFERMEDAD_COMUN,
    diagnostico: 'Gripe',
    observaciones: 'Reposo',
    documento_justificativo: undefined,
    hash: 'test-hash',
    hash_anterior: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BajasMedicasService,
        {
          provide: getRepositoryToken(BajaMedica),
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

    service = module.get<BajasMedicasService>(BajasMedicasService);
    bajasRepository = module.get<Repository<BajaMedica>>(
      getRepositoryToken(BajaMedica),
    );
    empleadosRepository = module.get<Repository<Empleado>>(
      getRepositoryToken(Empleado),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a medical leave', async () => {
      jest.spyOn(empleadosRepository, 'findOne').mockResolvedValue(mockEmpleado as any);
      jest.spyOn(bajasRepository, 'find').mockResolvedValue([]);
      jest.spyOn(bajasRepository, 'create').mockReturnValue(mockBaja as any);
      jest.spyOn(bajasRepository, 'save').mockResolvedValue(mockBaja as any);

      const result = await service.create({
        empleadoId: '1',
        fecha_inicio: new Date('2025-12-01'),
        fecha_fin: new Date('2025-12-10'),
        tipo: TipoBajaMedica.ENFERMEDAD_COMUN,
        diagnostico: 'Gripe',
        observaciones: 'Reposo',
        documento_justificativo: undefined,
      });

      expect(result).toBeDefined();
      expect(bajasRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      jest.spyOn(empleadosRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create({
          empleadoId: '999',
          fecha_inicio: new Date(),
          fecha_fin: new Date(),
          tipo: TipoBajaMedica.ENFERMEDAD_COMUN,
          diagnostico: 'Test',
          observaciones: '',
          documento_justificativo: undefined,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all medical leaves', async () => {
      jest.spyOn(bajasRepository, 'find').mockResolvedValue([mockBaja] as any);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findByEmpleado', () => {
    it('should return medical leaves for an employee', async () => {
      jest.spyOn(bajasRepository, 'find').mockResolvedValue([mockBaja] as any);

      const result = await service.findByEmpleado('1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findActivas', () => {
    it('should return active medical leaves', async () => {
      jest.spyOn(bajasRepository, 'find').mockResolvedValue([mockBaja] as any);

      const result = await service.findActivas();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
