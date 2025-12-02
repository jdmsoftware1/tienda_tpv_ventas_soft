import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CierreMesService } from './cierre-mes.service';
import { CierreMes } from '../entities/cierre-mes.entity';
import { Compra } from '../entities/compra.entity';
import { Pago } from '../entities/pago.entity';
import { Devolucion } from '../entities/devolucion.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CierreMesService', () => {
  let service: CierreMesService;

  const mockCierreMes = {
    id: '1',
    fecha_inicio: new Date('2024-01-01'),
    fecha_fin: new Date('2024-01-31'),
    total_ventas: 1000.00,
    total_pagos: 800.00,
    total_devoluciones: 50.00,
    cerrado: true,
    created_at: new Date(),
    compras: [],
    pagos: [],
    devoluciones: [],
  };

  const mockCierreMesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCompraRepository = {
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockPagoRepository = {
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockDevolucionRepository = {
    find: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CierreMesService,
        {
          provide: getRepositoryToken(CierreMes),
          useValue: mockCierreMesRepository,
        },
        {
          provide: getRepositoryToken(Compra),
          useValue: mockCompraRepository,
        },
        {
          provide: getRepositoryToken(Pago),
          useValue: mockPagoRepository,
        },
        {
          provide: getRepositoryToken(Devolucion),
          useValue: mockDevolucionRepository,
        },
      ],
    }).compile();

    service = module.get<CierreMesService>(CierreMesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new cierre de mes', async () => {
      const createDto = {
        fecha_inicio: new Date('2024-01-01'),
        fecha_fin: new Date('2024-01-31'),
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockCierreMesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCompraRepository.find.mockResolvedValue([{ id: 'c1', total: 500 }, { id: 'c2', total: 500 }]);
      mockPagoRepository.find.mockResolvedValue([{ id: 'p1', monto: 800 }]);
      mockDevolucionRepository.find.mockResolvedValue([{ id: 'd1', monto: 50 }]);
      mockCierreMesRepository.create.mockReturnValue(mockCierreMes);
      mockCierreMesRepository.save.mockResolvedValue(mockCierreMes);
      mockCierreMesRepository.findOne.mockResolvedValue(mockCierreMes);
      mockCompraRepository.update.mockResolvedValue({ affected: 2 });
      mockPagoRepository.update.mockResolvedValue({ affected: 1 });
      mockDevolucionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.create(createDto);

      expect(mockCierreMesRepository.create).toHaveBeenCalled();
      expect(mockCierreMesRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCierreMes);
    });

    it('should throw BadRequestException if cierre already exists in date range', async () => {
      const createDto = {
        fecha_inicio: new Date('2024-01-01'),
        fecha_fin: new Date('2024-01-31'),
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCierreMes),
      };

      mockCierreMesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of cierres', async () => {
      const cierres = [mockCierreMes];
      mockCierreMesRepository.find.mockResolvedValue(cierres);

      const result = await service.findAll();

      expect(mockCierreMesRepository.find).toHaveBeenCalledWith({
        order: { fecha_fin: 'DESC' },
      });
      expect(result).toEqual(cierres);
    });
  });

  describe('findOne', () => {
    it('should return a cierre by id', async () => {
      mockCierreMesRepository.findOne.mockResolvedValue(mockCierreMes);

      const result = await service.findOne('1');

      expect(mockCierreMesRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['compras', 'pagos', 'devoluciones'],
      });
      expect(result).toEqual(mockCierreMes);
    });

    it('should throw NotFoundException if cierre not found', async () => {
      mockCierreMesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics without date filter', async () => {
      const cierres = [mockCierreMes];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(cierres),
      };

      mockCierreMesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAnalytics();

      expect(result).toHaveProperty('cierres');
      expect(result).toHaveProperty('totales');
      expect(result.totales).toHaveProperty('ventas');
      expect(result.totales).toHaveProperty('pagos');
      expect(result.totales).toHaveProperty('devoluciones');
    });

    it('should return analytics with date filter', async () => {
      const cierres = [mockCierreMes];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(cierres),
      };

      mockCierreMesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAnalytics(
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result.cierres).toEqual(cierres);
    });
  });

  describe('getCurrentMonthStats', () => {
    it('should return current month statistics', async () => {
      mockCompraRepository.find.mockResolvedValue([{ total: 500 }, { total: 300 }]);
      mockPagoRepository.find.mockResolvedValue([{ monto: 400 }]);
      mockDevolucionRepository.find.mockResolvedValue([{ monto: 50 }]);

      const result = await service.getCurrentMonthStats();

      expect(result).toHaveProperty('periodo');
      expect(result).toHaveProperty('total_ventas', 800);
      expect(result).toHaveProperty('total_pagos', 400);
      expect(result).toHaveProperty('total_devoluciones', 50);
      expect(result).toHaveProperty('cantidad_ventas', 2);
      expect(result).toHaveProperty('cantidad_pagos', 1);
      expect(result).toHaveProperty('cantidad_devoluciones', 1);
    });
  });
});
