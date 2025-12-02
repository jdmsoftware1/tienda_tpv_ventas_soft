import { Test, TestingModule } from '@nestjs/testing';
import { CierreMesController } from './cierre-mes.controller';
import { CierreMesService } from './cierre-mes.service';
import { CreateCierreMesDto } from './dto/create-cierre-mes.dto';

describe('CierreMesController', () => {
  let controller: CierreMesController;
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

  const mockCierreMesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getAnalytics: jest.fn(),
    getCurrentMonthStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CierreMesController],
      providers: [
        {
          provide: CierreMesService,
          useValue: mockCierreMesService,
        },
      ],
    }).compile();

    controller = module.get<CierreMesController>(CierreMesController);
    service = module.get<CierreMesService>(CierreMesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new cierre de mes', async () => {
      const createDto: CreateCierreMesDto = {
        fecha_inicio: new Date('2024-01-01'),
        fecha_fin: new Date('2024-01-31'),
      };

      mockCierreMesService.create.mockResolvedValue(mockCierreMes);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCierreMes);
    });
  });

  describe('findAll', () => {
    it('should return an array of cierres', async () => {
      const cierres = [mockCierreMes];
      mockCierreMesService.findAll.mockResolvedValue(cierres);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(cierres);
    });
  });

  describe('findOne', () => {
    it('should return a cierre by id', async () => {
      mockCierreMesService.findOne.mockResolvedValue(mockCierreMes);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCierreMes);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics without date filter', async () => {
      const analytics = {
        cierres: [mockCierreMes],
        totales: {
          ventas: 1000,
          pagos: 800,
          devoluciones: 50,
        },
      };

      mockCierreMesService.getAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics();

      expect(service.getAnalytics).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(analytics);
    });

    it('should return analytics with date filter', async () => {
      const analytics = {
        cierres: [mockCierreMes],
        totales: {
          ventas: 1000,
          pagos: 800,
          devoluciones: 50,
        },
      };

      mockCierreMesService.getAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics('2024-01-01', '2024-12-31');

      expect(service.getAnalytics).toHaveBeenCalled();
      expect(result).toEqual(analytics);
    });
  });

  describe('getCurrentMonth', () => {
    it('should return current month stats', async () => {
      const stats = {
        periodo: {
          inicio: new Date(),
          fin: new Date(),
        },
        total_ventas: 1000,
        total_pagos: 800,
        total_devoluciones: 50,
        cantidad_ventas: 10,
        cantidad_pagos: 5,
        cantidad_devoluciones: 2,
      };

      mockCierreMesService.getCurrentMonthStats.mockResolvedValue(stats);

      const result = await controller.getCurrentMonth();

      expect(service.getCurrentMonthStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });
});
