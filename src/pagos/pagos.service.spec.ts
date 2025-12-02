import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagosService } from './pagos.service';
import { Pago } from '../entities/pago.entity';
import { NotFoundException } from '@nestjs/common';

describe('PagosService', () => {
  let service: PagosService;
  let repository: Repository<Pago>;

  const mockPago = {
    id: '1',
    cliente_id: 'cliente-1',
    monto: 50.00,
    descripcion: 'Pago de prueba',
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
        PagosService,
        {
          provide: getRepositoryToken(Pago),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
    repository = module.get<Repository<Pago>>(getRepositoryToken(Pago));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new pago', async () => {
      const createDto = {
        cliente_id: 'cliente-1',
        monto: 50.00,
        descripcion: 'Pago de prueba',
      };

      mockRepository.create.mockReturnValue(mockPago);
      mockRepository.save.mockResolvedValue(mockPago);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockPago);
      expect(result).toEqual(mockPago);
    });
  });

  describe('findAll', () => {
    it('should return an array of pagos', async () => {
      const pagos = [mockPago];
      mockRepository.find.mockResolvedValue(pagos);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['cliente'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(pagos);
    });
  });

  describe('findOne', () => {
    it('should return a pago by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockPago);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['cliente'],
      });
      expect(result).toEqual(mockPago);
    });

    it('should throw NotFoundException if pago not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCliente', () => {
    it('should return pagos by cliente_id', async () => {
      const pagos = [mockPago];
      mockRepository.find.mockResolvedValue(pagos);

      const result = await service.findByCliente('cliente-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { cliente_id: 'cliente-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(pagos);
    });
  });

  describe('remove', () => {
    it('should remove a pago', async () => {
      mockRepository.findOne.mockResolvedValue(mockPago);
      mockRepository.remove.mockResolvedValue(mockPago);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockPago);
    });

    it('should throw NotFoundException if pago not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
