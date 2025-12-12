import { Test, TestingModule } from '@nestjs/testing';
import { PlantillasHorariasController } from './plantillas-horarias.controller';
import { PlantillasHorariasService } from './plantillas-horarias.service';

describe('PlantillasHorariasController', () => {
  let controller: PlantillasHorariasController;
  let service: PlantillasHorariasService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    verifyIntegrity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantillasHorariasController],
      providers: [
        {
          provide: PlantillasHorariasService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PlantillasHorariasController>(PlantillasHorariasController);
    service = module.get<PlantillasHorariasService>(PlantillasHorariasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const mockPlantilla = { id: '1', nombre: 'Test' };
      mockService.create.mockResolvedValue(mockPlantilla);

      const result = await controller.create({
        nombre: 'Test',
        horarios: [],
      });

      expect(result).toEqual(mockPlantilla);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      const mockPlantillas = [{ id: '1', nombre: 'Test' }];
      mockService.findAll.mockResolvedValue(mockPlantillas);

      const result = await controller.findAll();

      expect(result).toEqual(mockPlantillas);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
