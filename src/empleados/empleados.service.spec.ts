import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpleadosService } from './empleados.service';
import { Empleado } from '../entities/empleado.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('EmpleadosService', () => {
  let service: EmpleadosService;
  let repository: Repository<Empleado>;

  const mockEmpleado = {
    id: '1',
    id_empleado: 'EMP001',
    nombre: 'Juan Empleado',
    clientes: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpleadosService,
        {
          provide: getRepositoryToken(Empleado),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EmpleadosService>(EmpleadosService);
    repository = module.get<Repository<Empleado>>(getRepositoryToken(Empleado));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new empleado', async () => {
      const createDto = {
        id_empleado: 'EMP001',
        nombre: 'Juan Empleado',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockEmpleado);
      mockRepository.save.mockResolvedValue(mockEmpleado);

      const result = await service.create(createDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id_empleado: createDto.id_empleado },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEmpleado);
      expect(result).toEqual(mockEmpleado);
    });

    it('should throw ConflictException if id_empleado already exists', async () => {
      const createDto = {
        id_empleado: 'EMP001',
        nombre: 'Juan Empleado',
      };

      mockRepository.findOne.mockResolvedValue(mockEmpleado);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of empleados', async () => {
      const empleados = [mockEmpleado];
      mockRepository.find.mockResolvedValue(empleados);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['clientes'],
        order: { nombre: 'ASC' },
      });
      expect(result).toEqual(empleados);
    });
  });

  describe('findOne', () => {
    it('should return an empleado by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmpleado);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['clientes'],
      });
      expect(result).toEqual(mockEmpleado);
    });

    it('should throw NotFoundException if empleado not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search empleados by query', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEmpleado]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search('Juan');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('empleado');
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toEqual([mockEmpleado]);
    });
  });

  describe('update', () => {
    it('should update an empleado', async () => {
      const updateDto = { nombre: 'Juan Actualizado' };
      const updatedEmpleado = { ...mockEmpleado, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockEmpleado);
      mockRepository.save.mockResolvedValue(updatedEmpleado);

      const result = await service.update('1', updateDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.nombre).toEqual(updateDto.nombre);
    });

    it('should throw NotFoundException if empleado not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new id_empleado already exists', async () => {
      const updateDto = { id_empleado: 'EMP002' };
      const existingEmpleado = { ...mockEmpleado, id: '2', id_empleado: 'EMP002' };

      mockRepository.findOne
        .mockResolvedValueOnce(mockEmpleado)
        .mockResolvedValueOnce(existingEmpleado);

      await expect(service.update('1', updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an empleado', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmpleado);
      mockRepository.remove.mockResolvedValue(mockEmpleado);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockEmpleado);
    });

    it('should throw NotFoundException if empleado not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
