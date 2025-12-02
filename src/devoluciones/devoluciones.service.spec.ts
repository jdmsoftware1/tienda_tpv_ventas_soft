import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevolucionesService } from './devoluciones.service';
import { Devolucion } from '../entities/devolucion.entity';
import { NotFoundException } from '@nestjs/common';

describe('DevolucionesService', () => {
  let service: DevolucionesService;
  let repository: Repository<Devolucion>;

  const mockDevolucion = {
    id: '1',
    cliente_id: 'cliente-1',
    monto: 25.00,
    descripcion: 'Devolución de prueba',
    created_at: new Date(),
    cliente: {
      id: 'cliente-1',
      nombre: 'Cliente Test',
    },
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevolucionesService,
        {
          provide: getRepositoryToken(Devolucion),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DevolucionesService>(DevolucionesService);
    repository = module.get<Repository<Devolucion>>(getRepositoryToken(Devolucion));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new devolucion', async () => {
      const createDto = {
        cliente_id: 'cliente-1',
        monto: 25.00,
        descripcion: 'Devolución de prueba',
      };

      mockRepository.create.mockReturnValue(mockDevolucion);
      mockRepository.save.mockResolvedValue(mockDevolucion);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockDevolucion);
      expect(result).toEqual(mockDevolucion);
    });
  });

  describe('findAll', () => {
    it('should return an array of devoluciones', async () => {
      const devoluciones = [mockDevolucion];
      mockRepository.find.mockResolvedValue(devoluciones);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['cliente'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(devoluciones);
    });
  });

  describe('findOne', () => {
    it('should return a devolucion by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockDevolucion);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['cliente'],
      });
      expect(result).toEqual(mockDevolucion);
    });

    it('should throw NotFoundException if devolucion not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCliente', () => {
    it('should return devoluciones by cliente_id', async () => {
      const devoluciones = [mockDevolucion];
      mockRepository.find.mockResolvedValue(devoluciones);

      const result = await service.findByCliente('cliente-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { cliente_id: 'cliente-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(devoluciones);
    });
  });

  describe('remove', () => {
    it('should remove a devolucion', async () => {
      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockRepository.remove.mockResolvedValue(mockDevolucion);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockDevolucion);
    });

    it('should throw NotFoundException if devolucion not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
