import { Test, TestingModule } from '@nestjs/testing';
import { FestivosController } from './festivos.controller';
import { FestivosService } from './festivos.service';

describe('FestivosController', () => {
  let controller: FestivosController;
  let service: FestivosService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByYear: jest.fn(),
    isFestivo: jest.fn(),
    verifyChainIntegrity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FestivosController],
      providers: [
        {
          provide: FestivosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FestivosController>(FestivosController);
    service = module.get<FestivosService>(FestivosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a holiday', async () => {
      const mockFestivo = { id: '1', nombre: 'Navidad' };
      mockService.create.mockResolvedValue(mockFestivo);

      const result = await controller.create({
        fecha: '2025-12-25',
        nombre: 'Navidad',
        tipo: 'nacional' as any,
      });

      expect(result).toEqual(mockFestivo);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all holidays', async () => {
      const mockFestivos = [{ id: '1', nombre: 'Navidad' }];
      mockService.findAll.mockResolvedValue(mockFestivos);

      const result = await controller.findAll();

      expect(result).toEqual(mockFestivos);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByYear', () => {
    it('should return holidays for a specific year', async () => {
      const mockFestivos = [{ id: '1', nombre: 'Navidad' }];
      mockService.findByYear.mockResolvedValue(mockFestivos);

      const result = await service.findByYear(2025);

      expect(result).toEqual(mockFestivos);
      expect(service.findByYear).toHaveBeenCalledWith(2025);
    });
  });
});
