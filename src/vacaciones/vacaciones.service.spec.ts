import { Test, TestingModule } from '@nestjs/testing';
import { VacacionesService } from './vacaciones.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vacacion, EstadoVacacion } from '../entities/vacacion.entity';
import { Empleado } from '../entities/empleado.entity';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VacacionesService', () => {
  let service: VacacionesService;
  let vacacionRepository: Repository<Vacacion>;
  let empleadoRepository: Repository<Empleado>;
  let userRepository: Repository<User>;

  const mockEmpleado = {
    id: '1',
    nombre: 'Juan',
    apellidos: 'Pérez',
    dias_vacaciones_disponibles: 22,
  };

  const mockUser = {
    id: 'user1',
    username: 'admin',
    role: 'admin',
  };

  const mockVacacion = {
    id: '1',
    empleado: mockEmpleado,
    fecha_inicio: new Date('2025-12-20'),
    fecha_fin: new Date('2025-12-27'),
    dias_solicitados: 6,
    estado: EstadoVacacion.PENDIENTE,
    motivo: 'Navidad',
    observaciones_admin: null,
    aprobado_por: null,
    fecha_aprobacion: null,
    hash: 'test-hash',
    hash_anterior: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacacionesService,
        {
          provide: getRepositoryToken(Vacacion),
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
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VacacionesService>(VacacionesService);
    vacacionRepository = module.get<Repository<Vacacion>>(
      getRepositoryToken(Vacacion),
    );
    empleadoRepository = module.get<Repository<Empleado>>(
      getRepositoryToken(Empleado),
    );
    userRepository = module.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('solicitar', () => {
    it('should create a vacation request', async () => {
      jest.spyOn(empleadoRepository, 'findOne').mockResolvedValue(mockEmpleado as any);
      jest.spyOn(vacacionRepository, 'find').mockResolvedValue([]);
      jest.spyOn(vacacionRepository, 'create').mockReturnValue(mockVacacion as any);
      jest.spyOn(vacacionRepository, 'save').mockResolvedValue(mockVacacion as any);

      const result = await service.solicitar(
        '1',
        new Date('2025-12-20'),
        new Date('2025-12-27'),
        'Navidad',
      );

      expect(result).toBeDefined();
      expect(vacacionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      jest.spyOn(empleadoRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.solicitar('999', new Date(), new Date()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not enough vacation days', async () => {
      const empleadoSinDias = { ...mockEmpleado, dias_vacaciones_disponibles: 1 };
      jest.spyOn(empleadoRepository, 'findOne').mockResolvedValue(empleadoSinDias as any);

      await expect(
        service.solicitar('1', new Date('2025-12-20'), new Date('2025-12-27')),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('aprobar', () => {
    it('should approve a vacation request', async () => {
      jest.spyOn(vacacionRepository, 'findOne').mockResolvedValue(mockVacacion as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(empleadoRepository, 'findOne').mockResolvedValue(mockEmpleado as any);
      jest.spyOn(empleadoRepository, 'save').mockResolvedValue(mockEmpleado as any);
      jest.spyOn(vacacionRepository, 'save').mockResolvedValue({
        ...mockVacacion,
        estado: EstadoVacacion.APROBADA,
      } as any);

      const result = await service.aprobar('1', 'user1', 'Aprobado');

      expect(result).toBeDefined();
      expect(result.estado).toBe(EstadoVacacion.APROBADA);
    });

    it('should throw NotFoundException if vacation not found', async () => {
      jest.spyOn(vacacionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.aprobar('999', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rechazar', () => {
    it('should reject a vacation request', async () => {
      jest.spyOn(vacacionRepository, 'findOne').mockResolvedValue(mockVacacion as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(vacacionRepository, 'save').mockResolvedValue({
        ...mockVacacion,
        estado: EstadoVacacion.RECHAZADA,
      } as any);

      const result = await service.rechazar('1', 'user1', 'No aprobado');

      expect(result).toBeDefined();
      expect(result.estado).toBe(EstadoVacacion.RECHAZADA);
    });
  });

  describe('findAll', () => {
    it('should return all vacations', async () => {
      jest.spyOn(vacacionRepository, 'find').mockResolvedValue([mockVacacion] as any);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findByEmpleado', () => {
    it('should return vacations for an employee', async () => {
      jest.spyOn(vacacionRepository, 'find').mockResolvedValue([mockVacacion] as any);

      const result = await service.findByEmpleado('1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findPendientes', () => {
    it('should return pending vacations', async () => {
      jest.spyOn(vacacionRepository, 'find').mockResolvedValue([mockVacacion] as any);

      const result = await service.findPendientes();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
